import { useState } from 'react'
import './RemoveWatermark.css'

const RemoveWatermark = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
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

  const handleProcess = () => {
    // Placeholder for watermark removal
    if (preview) {
      setResult(preview)
    }
  }

  return (
    <div className="remove-watermark">
      <div className="tool-header">
        <h3 className="tool-title">💧 去除水印</h3>
        <p className="tool-description">智能识别并移除图片中的水印和文字标记</p>
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
              <p className="upload-hint">支持 JPG、PNG 格式</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="file-input"
                id="watermark-file-input"
              />
              <label htmlFor="watermark-file-input" className="upload-btn">
                选择文件
              </label>
            </div>
          </div>
        ) : (
          <div className="preview-container">
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
                  {result ? (
                    <img src={result} alt="Processed" />
                  ) : (
                    <div className="placeholder-result">
                      <span className="placeholder-icon">✨</span>
                      <p>点击处理按钮开始去除水印</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="preview-actions">
              <button className="action-btn secondary" onClick={() => {
                setPreview(null)
                setSelectedFile(null)
                setResult(null)
              }}>
                重新选择
              </button>
              <button className="action-btn primary" onClick={handleProcess}>
                开始处理
              </button>
              {result && (
                <button className="action-btn success">
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
              <span className="info-value">{result ? '已完成' : '待处理'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default RemoveWatermark

