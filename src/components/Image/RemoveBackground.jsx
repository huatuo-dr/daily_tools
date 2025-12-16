import { useState } from 'react'
import { removeBackground } from '@imgly/background-removal'
import './RemoveBackground.css'

const RemoveBackground = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [processingTime, setProcessingTime] = useState(null)
  const [startTime, setStartTime] = useState(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setError(null)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
        setResult(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setError(null)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
        setResult(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleProcess = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError(null)
    setResult(null)
    setProcessingTime(null)
    
    // Record start time
    const start = performance.now()
    setStartTime(start)

    try {
      // Use removeBackground from @imgly/background-removal
      const blob = await removeBackground(selectedFile, {
        // Optional: configure model and output format
        model: 'medium', // 'small', 'medium', 'large' - larger models are more accurate but slower
        outputFormat: 'image/png', // PNG supports transparency
      })

      // Calculate processing time
      const end = performance.now()
      const duration = ((end - start) / 1000).toFixed(2) // Convert to seconds with 2 decimal places
      setProcessingTime(duration)

      // Convert blob to data URL for display
      const reader = new FileReader()
      reader.onloadend = () => {
        setResult(reader.result)
        setIsProcessing(false)
      }
      reader.readAsDataURL(blob)
    } catch (err) {
      console.error('Background removal error:', err)
      setError('处理失败，请重试。如果图片过大，请尝试压缩后再处理。')
      setIsProcessing(false)
      setProcessingTime(null)
      setStartTime(null)
    }
  }

  const handleDownload = () => {
    if (!result) return

    const link = document.createElement('a')
    link.href = result
    const fileName = selectedFile.name.replace(/\.[^/.]+$/, '')
    link.download = `${fileName}_no_background.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="remove-background">
      <div className="tool-header">
        <h3 className="tool-title">🎭 去除背景</h3>
        <p className="tool-description">智能识别并移除图片背景，支持人像、物品等</p>
      </div>

      <div className="upload-area">
        {!preview ? (
          <div
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="drop-zone-content">
              <span className="upload-icon">📤</span>
              <p className="upload-text">拖拽图片到此处或点击上传</p>
              <p className="upload-hint">支持 JPG、PNG 格式，建议使用清晰的主体图片</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="file-input"
                id="bg-file-input"
              />
              <label htmlFor="bg-file-input" className="upload-btn">
                选择文件
              </label>
            </div>
          </div>
        ) : (
          <div className="preview-container">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            
            <div className="image-comparison">
              <div className="comparison-item">
                <h4 className="comparison-label">原图</h4>
                <div className="image-wrapper">
                  <img src={preview} alt="Original" />
                </div>
              </div>
              <div className="comparison-item">
                <h4 className="comparison-label">处理后</h4>
                <div className="image-wrapper">
                  {isProcessing ? (
                    <div className="processing-indicator">
                      <div className="spinner"></div>
                      <p>正在处理中，请稍候...</p>
                      <p className="processing-hint">首次加载模型可能需要一些时间</p>
                    </div>
                  ) : result ? (
                    <img src={result} alt="Processed" />
                  ) : (
                    <div className="placeholder-result">
                      <span className="placeholder-icon">✨</span>
                      <p>点击处理按钮开始去除背景</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="preview-actions">
              <button 
                className="action-btn secondary" 
                onClick={() => {
                  setPreview(null)
                  setSelectedFile(null)
                  setResult(null)
                  setError(null)
                  setProcessingTime(null)
                  setStartTime(null)
                }}
                disabled={isProcessing}
              >
                重新选择
              </button>
              <button 
                className="action-btn primary" 
                onClick={handleProcess}
                disabled={isProcessing}
              >
                {isProcessing ? '处理中...' : '开始处理'}
              </button>
              {result && (
                <button className="action-btn success" onClick={handleDownload}>
                  下载结果
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="tool-info">
        <div className="info-item">
          <span className="info-label">当前图片：</span>
          <span className="info-value">{selectedFile?.name || '未选择'}</span>
        </div>
        {selectedFile && (
          <>
            <div className="info-item">
              <span className="info-label">文件大小：</span>
              <span className="info-value">{(selectedFile.size / 1024).toFixed(2)} KB</span>
            </div>
            <div className="info-item">
              <span className="info-label">处理状态：</span>
              <span className="info-value">
                {isProcessing ? '处理中...' : result ? '已完成' : '待处理'}
              </span>
            </div>
            {processingTime && (
              <div className="info-item">
                <span className="info-label">处理时间：</span>
                <span className="info-value highlight">{processingTime} 秒</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default RemoveBackground
