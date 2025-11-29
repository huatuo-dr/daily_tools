import { useState, useEffect } from 'react'
import './News.css'

const News = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [htmlContent, setHtmlContent] = useState('')
  const [error, setError] = useState(null)
  
  // TrendRadar GitHub raw URL
  const NEWS_URL = 'https://raw.githubusercontent.com/KyleDeng/TrendRadar/refs/heads/master/index.html'

  const fetchNewsContent = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(NEWS_URL + '?t=' + Date.now())
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const html = await response.text()
      setHtmlContent(html)
      setIsLoading(false)
    } catch (err) {
      console.error('Failed to fetch news:', err)
      setError(err.message)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNewsContent()
  }, [])

  const handleRefresh = () => {
    setLastRefresh(new Date())
    fetchNewsContent()
  }

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return (
    <div className="news">
      <div className="news-header">
        <div className="news-title-group">
          <h2 className="news-title">新闻热点</h2>
          <span className="news-source">来源：TrendRadar</span>
        </div>
        <div className="news-controls">
          <span className="last-refresh">
            上次刷新：{formatTime(lastRefresh)}
          </span>
          <button 
            onClick={handleRefresh} 
            className="refresh-btn"
            disabled={isLoading}
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="news-loading">
          <div className="loading-spinner"></div>
          <p>正在加载新闻...</p>
        </div>
      )}

      {error && (
        <div className="news-error">
          <p className="error-icon">⚠️</p>
          <p className="error-message">加载失败：{error}</p>
          <button onClick={handleRefresh} className="retry-btn">
            重试
          </button>
        </div>
      )}

      {!isLoading && !error && htmlContent && (
        <div 
          className="news-content-container"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}
    </div>
  )
}

export default News

