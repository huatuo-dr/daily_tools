import { useMemo } from 'react'
import { Solar } from 'lunar-javascript'
import './AlmanacPanel.css'

const AlmanacPanel = ({ selectedDate }) => {
  const almanacData = useMemo(() => {
    if (!selectedDate) return null

    try {
      const year = selectedDate.getFullYear()
      const month = selectedDate.getMonth() + 1
      const day = selectedDate.getDate()
      
      const solar = Solar.fromYmd(year, month, day)
      const lunar = solar.getLunar()
      
      // Get basic lunar info
      const lunarDateStr = `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
      const yearInGanZhi = lunar.getYearInGanZhi()
      const monthInGanZhi = lunar.getMonthInGanZhi()
      const dayInGanZhi = lunar.getDayInGanZhi()
      
      // Get zodiac
      const yearShengXiao = lunar.getYearShengXiao()
      
      // Get suitable activities (宜)
      const yi = lunar.getDayYi()
      
      // Get unsuitable activities (忌)
      const ji = lunar.getDayJi()
      
      // Get conflicts (冲)
      const chong = lunar.getDayChongDesc()
      
      // Get evil direction (煞)
      const sha = lunar.getDaySha()
      
      // Get festivals
      const festivals = lunar.getFestivals()
      const solarFestivals = solar.getFestivals()
      
      // Get solar term
      const jieQi = lunar.getJieQi()
      
      // Get lucky gods (吉神)
      const jiShen = lunar.getDayJiShen()
      
      // Get evil gods (凶神)
      const xiongSha = lunar.getDayXiongSha()
      
      // Get fetal god position (胎神)
      const taiShen = lunar.getDayPositionTai()
      
      // Get Wu Xing (五行)
      const wuXing = lunar.getDayNaYin()
      
      return {
        solarDate: `${year}年${month}月${day}日`,
        lunarDate: lunarDateStr,
        ganZhi: {
          year: yearInGanZhi,
          month: monthInGanZhi,
          day: dayInGanZhi
        },
        shengXiao: yearShengXiao,
        yi: yi.length > 0 ? yi : ['诸事不宜'],
        ji: ji.length > 0 ? ji : ['无'],
        chong,
        sha,
        festivals: [...festivals, ...solarFestivals],
        jieQi,
        jiShen: jiShen.length > 0 ? jiShen : ['无'],
        xiongSha: xiongSha.length > 0 ? xiongSha : ['无'],
        taiShen,
        wuXing
      }
    } catch (error) {
      console.error('Error getting almanac data:', error)
      return null
    }
  }, [selectedDate])

  if (!almanacData) {
    return (
      <div className="almanac-panel">
        <div className="almanac-error">无法获取黄历信息</div>
      </div>
    )
  }

  return (
    <div className="almanac-panel">
      <h3 className="almanac-title">📜 黄历</h3>
      
      <div className="almanac-content">
        {/* Date Info Section */}
        <div className="almanac-section date-section">
          <div className="almanac-date-header">
            <div className="solar-date">{almanacData.solarDate}</div>
            <div className="lunar-date">{almanacData.lunarDate}</div>
          </div>
          
          <div className="almanac-ganZhi">
            <div className="ganZhi-item">
              <span className="ganZhi-label">年：</span>
              <span className="ganZhi-value">{almanacData.ganZhi.year} {almanacData.shengXiao}年</span>
            </div>
            <div className="ganZhi-item">
              <span className="ganZhi-label">月：</span>
              <span className="ganZhi-value">{almanacData.ganZhi.month}月</span>
            </div>
            <div className="ganZhi-item">
              <span className="ganZhi-label">日：</span>
              <span className="ganZhi-value">{almanacData.ganZhi.day}日</span>
            </div>
          </div>

          {(almanacData.festivals.length > 0 || almanacData.jieQi) && (
            <div className="almanac-festivals">
              {almanacData.jieQi && (
                <span className="festival-tag jieqi">{almanacData.jieQi}</span>
              )}
              {almanacData.festivals.map((festival, index) => (
                <span key={index} className="festival-tag">{festival}</span>
              ))}
            </div>
          )}
        </div>

        {/* Yi Ji Section */}
        <div className="almanac-section yi-ji-section">
          <div className="yi-section">
            <div className="section-header yi-header">
              <span className="section-icon">✅</span>
              <span className="section-title">宜</span>
            </div>
            <div className="section-content">
              {almanacData.yi.map((item, index) => (
                <span key={index} className="almanac-tag yi-tag">{item}</span>
              ))}
            </div>
          </div>
          
          <div className="ji-section">
            <div className="section-header ji-header">
              <span className="section-icon">⛔</span>
              <span className="section-title">忌</span>
            </div>
            <div className="section-content">
              {almanacData.ji.map((item, index) => (
                <span key={index} className="almanac-tag ji-tag">{item}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="almanac-section detail-section">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">冲煞：</span>
              <span className="detail-value">{almanacData.chong} {almanacData.sha}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">五行：</span>
              <span className="detail-value">{almanacData.wuXing}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">胎神：</span>
              <span className="detail-value">{almanacData.taiShen}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">吉神：</span>
              <span className="detail-value">
                {almanacData.jiShen.slice(0, 3).join('、')}
                {almanacData.jiShen.length > 3 ? '...' : ''}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">凶煞：</span>
              <span className="detail-value">
                {almanacData.xiongSha.slice(0, 3).join('、')}
                {almanacData.xiongSha.length > 3 ? '...' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlmanacPanel

