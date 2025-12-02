# 使用 Node.js 20 Alpine 版本（体积小）
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，因为构建需要 vite）
RUN npm ci

# 复制项目源代码
COPY . .

# 构建生产版本
RUN npm run build

# 全局安装 serve（用于提供静态文件服务）
RUN npm install -g serve

# 暴露端口 3001
EXPOSE 3001

# 启动命令：使用 serve 提供静态文件服务
CMD ["serve", "-s", "dist", "-l", "3001"]

