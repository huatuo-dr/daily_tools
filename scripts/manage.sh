#!/bin/bash

# daily_tools 管理脚本
# 功能：启动/停止 Docker 服务，自动更新代码

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 项目根目录：脚本在 scripts 目录下时，项目根目录是脚本目录的父目录
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_FILE="$PROJECT_DIR/.manage.pid"
LOG_FILE="$PROJECT_DIR/.manage.log"
HISTORY_FILE="$PROJECT_DIR/.update_history.log"
CRON_JOB_ID="daily_tools_auto_update"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查 Docker Compose 是否运行
is_docker_running() {
    cd "$PROJECT_DIR"
    if docker compose ps | grep -q "Up"; then
        return 0
    else
        return 1
    fi
}

# 启动 Docker 服务
start_docker() {
    cd "$PROJECT_DIR"
    log "启动 Docker Compose..."
    # 使用 --build 确保使用最新代码构建
    # 如果镜像已存在，会重新构建；如果容器已存在，会先停止并重新创建
    docker compose up -d --build
    if [ $? -eq 0 ]; then
        log "Docker Compose 启动成功"
        return 0
    else
        log "Docker Compose 启动失败"
        return 1
    fi
}

# 停止 Docker 服务
stop_docker() {
    cd "$PROJECT_DIR"
    log "停止 Docker Compose..."
    docker compose down
    if [ $? -eq 0 ]; then
        log "Docker Compose 停止成功"
        return 0
    else
        log "Docker Compose 停止失败"
        return 1
    fi
}

# 更新代码并重启
update_and_restart() {
    cd "$PROJECT_DIR"
    UPDATE_START_TIME=$(date '+%Y-%m-%d %H:%M:%S')
    log "========== 开始自动更新 =========="
    
    # 记录更新开始
    echo "[$UPDATE_START_TIME] ========== 开始自动更新 ==========" >> "$HISTORY_FILE"
    
    # 停止 Docker
    stop_docker
    sleep 2
    
    # 拉取最新代码
    log "拉取最新代码..."
    git pull origin main 2>&1 | tee -a "$LOG_FILE"
    PULL_STATUS=$?
    
    if [ $PULL_STATUS -eq 0 ]; then
        # 获取最新提交信息
        LATEST_COMMIT=$(git log -1 --pretty=format:"%h - %s (%an)" 2>/dev/null || echo "未知")
        
        log "代码更新成功"
        
        # 重新构建并启动
        log "重新构建镜像..."
        docker compose build --no-cache 2>&1 | tee -a "$LOG_FILE"
        BUILD_STATUS=$?
        
        log "启动 Docker Compose..."
        docker compose up -d 2>&1 | tee -a "$LOG_FILE"
        
        UPDATE_END_TIME=$(date '+%Y-%m-%d %H:%M:%S')
        
        if is_docker_running; then
            log "========== 自动更新完成 =========="
            # 记录成功历史
            echo "  结果: ✅ 更新成功" >> "$HISTORY_FILE"
            echo "  提交: $LATEST_COMMIT" >> "$HISTORY_FILE"
            echo "  结束时间: $UPDATE_END_TIME" >> "$HISTORY_FILE"
            echo "" >> "$HISTORY_FILE"
            return 0
        else
            log "========== 自动更新失败：Docker 启动失败 =========="
            # 记录失败历史
            echo "  结果: ❌ 更新失败 - Docker 启动失败" >> "$HISTORY_FILE"
            echo "  提交: $LATEST_COMMIT" >> "$HISTORY_FILE"
            echo "  结束时间: $UPDATE_END_TIME" >> "$HISTORY_FILE"
            echo "" >> "$HISTORY_FILE"
            return 1
        fi
    else
        UPDATE_END_TIME=$(date '+%Y-%m-%d %H:%M:%S')
        log "========== 自动更新失败：Git pull 失败 =========="
        # 记录失败历史
        echo "  结果: ❌ 更新失败 - Git pull 失败" >> "$HISTORY_FILE"
        echo "  结束时间: $UPDATE_END_TIME" >> "$HISTORY_FILE"
        echo "" >> "$HISTORY_FILE"
        # 即使 pull 失败，也尝试启动 Docker
        start_docker
        return 1
    fi
}

# 后台监控进程
monitor_process() {
    while true; do
        # 检查 Docker 是否还在运行
        if ! is_docker_running; then
            log "检测到 Docker 服务停止，尝试重新启动..."
            start_docker
        fi
        
        # 检查脚本 PID 文件是否存在
        if [ ! -f "$PID_FILE" ]; then
            log "PID 文件不存在，退出监控进程"
            exit 0
        fi
        
        # 检查主进程是否还在运行
        if ! kill -0 $(cat "$PID_FILE") 2>/dev/null; then
            log "主进程已停止，退出监控进程"
            rm -f "$PID_FILE"
            exit 0
        fi
        
        sleep 60  # 每分钟检查一次
    done
}

# 设置定时任务
setup_cron() {
    # 获取脚本绝对路径
    SCRIPT_PATH="$SCRIPT_DIR/manage.sh"
    
    # 创建临时 crontab 文件
    CRON_TEMP=$(mktemp)
    crontab -l 2>/dev/null | grep -v "manage.sh.*auto-update" | grep -v "$CRON_JOB_ID" > "$CRON_TEMP" || true
    
    # 添加新的定时任务（每天早上6:00执行更新）
    # 使用项目根目录和脚本绝对路径
    echo "0 6 * * * cd $PROJECT_DIR && bash $SCRIPT_PATH auto-update >> $LOG_FILE 2>&1 # $CRON_JOB_ID" >> "$CRON_TEMP"
    
    # 安装新的 crontab
    crontab "$CRON_TEMP"
    rm "$CRON_TEMP"
    
    log "定时任务已设置：每天早上 6:00 自动更新"
}

# 移除定时任务
remove_cron() {
    CRON_TEMP=$(mktemp)
    crontab -l 2>/dev/null | grep -v "manage.sh.*auto-update" | grep -v "$CRON_JOB_ID" > "$CRON_TEMP" || true
    crontab "$CRON_TEMP"
    rm "$CRON_TEMP"
    log "定时任务已移除"
}

# 启动管理服务
start() {
    # 检查是否已经启动
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo -e "${YELLOW}管理服务已经在运行中 (PID: $PID)${NC}"
            return 1
        else
            rm -f "$PID_FILE"
        fi
    fi
    
    echo -e "${BLUE}启动 daily_tools 管理服务...${NC}"
    
    # 检查 Docker 是否已运行
    if is_docker_running; then
        echo -e "${GREEN}Docker Compose 已经在运行中${NC}"
        echo -e "${YELLOW}提示: 如需使用最新代码，请先执行 stop 或 kill，然后重新 start${NC}"
    else
        # 启动 Docker（会使用最新代码重新构建）
        if ! start_docker; then
            echo -e "${RED}启动失败！${NC}"
            return 1
        fi
    fi
    
    # 设置定时任务
    setup_cron
    
    # 启动后台监控进程
    monitor_process &
    MONITOR_PID=$!
    
    # 保存 PID
    echo $MONITOR_PID > "$PID_FILE"
    
    echo -e "${GREEN}管理服务启动成功！${NC}"
    echo -e "${BLUE}PID: $MONITOR_PID${NC}"
    echo -e "${BLUE}日志文件: $LOG_FILE${NC}"
    echo -e "${BLUE}定时任务: 每天早上 6:00 自动更新代码${NC}"
    
    log "管理服务启动成功 (PID: $MONITOR_PID)"
}

# 停止管理服务
stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo -e "${YELLOW}管理服务未运行${NC}"
        return 1
    fi
    
    PID=$(cat "$PID_FILE")
    
    if ! kill -0 "$PID" 2>/dev/null; then
        echo -e "${YELLOW}管理服务进程不存在${NC}"
        rm -f "$PID_FILE"
        return 1
    fi
    
    echo -e "${BLUE}停止管理服务...${NC}"
    
    # 停止监控进程
    kill "$PID" 2>/dev/null
    rm -f "$PID_FILE"
    
    # 移除定时任务
    remove_cron
    
    # 停止 Docker（可选，如果需要停止 Docker，取消下面的注释）
    # stop_docker
    
    echo -e "${GREEN}管理服务已停止${NC}"
    log "管理服务已停止"
}

# 完全停止（移除定时任务并停止 Docker）
kill_service() {
    echo -e "${BLUE}完全停止服务...${NC}"
    
    # 停止管理服务（如果运行中）
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo -e "${BLUE}停止管理服务...${NC}"
            kill "$PID" 2>/dev/null
            rm -f "$PID_FILE"
            log "管理服务已停止"
        fi
    fi
    
    # 移除定时任务
    echo -e "${BLUE}移除定时任务...${NC}"
    remove_cron
    
    # 停止 Docker Compose
    echo -e "${BLUE}停止 Docker Compose...${NC}"
    if is_docker_running; then
        stop_docker
        echo -e "${GREEN}Docker Compose 已停止${NC}"
    else
        echo -e "${YELLOW}Docker Compose 未运行${NC}"
    fi
    
    echo -e "${GREEN}服务已完全停止${NC}"
    log "服务已完全停止（定时任务已移除，Docker 已停止）"
}

# 查询状态
status() {
    echo -e "${BLUE}========== daily_tools 管理服务状态 ==========${NC}"
    
    # 检查管理服务是否运行
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo -e "${GREEN}管理服务: 运行中 (PID: $PID)${NC}"
        else
            echo -e "${RED}管理服务: 未运行（PID 文件存在但进程不存在）${NC}"
        fi
    else
        echo -e "${YELLOW}管理服务: 未运行${NC}"
    fi
    
    # 检查 Docker 状态
    echo ""
    echo -e "${BLUE}Docker Compose 状态:${NC}"
    cd "$PROJECT_DIR"
    if is_docker_running; then
        echo -e "${GREEN}运行中${NC}"
        docker compose ps
    else
        echo -e "${YELLOW}未运行${NC}"
    fi
    
    # 检查定时任务
    echo ""
    echo -e "${BLUE}定时任务状态:${NC}"
    if crontab -l 2>/dev/null | grep -q "manage.sh.*auto-update\|$CRON_JOB_ID"; then
        echo -e "${GREEN}已设置（每天早上 6:00 自动更新）${NC}"
        crontab -l 2>/dev/null | grep "manage.sh.*auto-update\|$CRON_JOB_ID"
    else
        echo -e "${YELLOW}未设置${NC}"
    fi
    
    # 显示最近日志
    echo ""
    echo -e "${BLUE}最近日志 (最后 10 行):${NC}"
    if [ -f "$LOG_FILE" ]; then
        tail -10 "$LOG_FILE"
    else
        echo "暂无日志"
    fi
}

# 显示更新历史
history() {
    echo -e "${BLUE}========== 自动更新历史记录 ==========${NC}"
    echo ""
    
    if [ -f "$HISTORY_FILE" ] && [ -s "$HISTORY_FILE" ]; then
        # 显示历史记录（倒序显示，最新的在前面）
        tac "$HISTORY_FILE" | head -50
        echo ""
        echo -e "${BLUE}提示: 完整历史记录保存在 $HISTORY_FILE${NC}"
    else
        echo -e "${YELLOW}暂无更新历史记录${NC}"
        echo ""
        echo -e "${BLUE}说明: 当定时任务（每天早上 6:00）触发自动更新时，会记录到此文件${NC}"
    fi
}

# 显示帮助信息
help() {
    echo -e "${BLUE}daily_tools 管理脚本${NC}"
    echo ""
    echo -e "${GREEN}用法:${NC}"
    echo "    $0 {start|stop|kill|status|history|auto-update|help}"
    echo ""
    echo -e "${GREEN}命令说明:${NC}"
    echo "    start       启动管理服务"
    echo "                - 启动 Docker Compose（如果未运行）"
    echo "                - 设置定时任务（每天早上 6:00 自动更新）"
    echo "                - 启动后台监控进程"
    echo ""
    echo "    stop        停止管理服务"
    echo "                - 停止后台监控进程"
    echo "                - 移除定时任务"
    echo "                - Docker Compose 保持运行状态"
    echo ""
    echo "    kill        完全停止服务"
    echo "                - 停止后台监控进程"
    echo "                - 移除定时任务"
    echo "                - 停止 Docker Compose"
    echo ""
    echo "    status      查询当前状态"
    echo "                - 管理服务运行状态"
    echo "                - Docker Compose 运行状态"
    echo "                - 定时任务状态"
    echo "                - 最近日志"
    echo ""
    echo "    history     显示更新历史"
    echo "                - 显示定时任务触发的自动更新历史记录"
    echo "                - 包括更新时间、结果（成功/失败）、提交信息等"
    echo ""
    echo "    auto-update 手动触发自动更新（定时任务调用）"
    echo "                - 停止 Docker"
    echo "                - 拉取最新代码"
    echo "                - 重新构建并启动"
    echo ""
    echo "    help        显示此帮助信息"
    echo ""
    echo -e "${GREEN}文件说明:${NC}"
    echo "    $PID_FILE       管理服务进程 ID"
    echo "    $LOG_FILE       运行日志"
    echo "    $HISTORY_FILE   更新历史记录"
    echo ""
    echo -e "${GREEN}示例:${NC}"
    echo "    $0 start      # 启动管理服务"
    echo "    $0 status     # 查看状态"
    echo "    $0 stop       # 停止管理服务（Docker 保持运行）"
    echo "    $0 kill       # 完全停止服务（包括 Docker）"
    echo "    $0 history    # 查看更新历史"
}

# 主函数
main() {
    case "${1:-help}" in
        start)
            start
            ;;
        stop)
            stop
            ;;
        kill)
            kill_service
            ;;
        status)
            status
            ;;
        history)
            history
            ;;
        auto-update)
            update_and_restart
            ;;
        help|--help|-h)
            help
            ;;
        *)
            echo -e "${RED}未知命令: $1${NC}"
            echo ""
            help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"

