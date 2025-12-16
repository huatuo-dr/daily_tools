import { useState } from 'react'
import './CompressImage.css'

const CompressImage = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [compressed, setCompressed] = useState(null)
  const [quality, setQuality] = useState(80)
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setOriginalSize(file.size)
      setCompressedSize(0)
      setCompressed(null)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setOriginalSize(file.size)
      setCompressedSize(0)
      setCompressed(null)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleCompress = () => {
    // Placeholder for compression
    if (preview) {
      setCompressed(preview)
      // Simulate compression - reduce size by quality percentage
      setCompressedSize(Math.round(originalSize * (quality / 100)))
    }
  }

  const compressionRatio = originalSize > 0 && compressedSize > 0
    ? ((1 - compressedSize / originalSize) * 100).toFixed(1)
    : 0

  return (
    <div className="compress-image">
      <div className="tool-header">
        <h3 className="tool-title">📦 修改体积</h3>
        <p className="tool-description">压缩图片大小，减小文件体积，保持图片质量</p>
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
              <p className="upload-hint">支持 JPG、PNG、WEBP 等格式</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="file-input"
                id="compress-file-input"
              />
              <label htmlFor="compress-file-input" className="upload-btn">
                选择文件
              </label>
            </div>
          </div>
        ) : (
          <div className="preview-container">
            <div className="compression-controls">
              <div className="control-item">
                <label className="control-label">压缩质量：{quality}%</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="quality-slider"
                />
                <div className="slider-labels">
                  <span>较小体积</span>
                  <span>较大体积</span>
                </div>
              </div>
            </div>

            <div className="image-comparison">
              <div className="comparison-item">
                <h4 className="comparison-label">原图</h4>
                <div className="image-wrapper">
                  <img src={preview} alt="Original" />
                </div>
                <div className="size-info">
                  <span className="size-label">文件大小：</span>
                  <span className="size-value">{(originalSize / 1024).toFixed(2)} KB</span>
                </div>
              </div>
              <div className="comparison-item">
                <h4 className="comparison-label">压缩后</h4>
                <div className="image-wrapper">
                  {compressed ? (
                    <img src={compressed} alt="Compressed" />
                  ) : (
                    <div className="placeholder-result">
                      <span className="placeholder-icon">📦</span>
                      <p>调整质量后点击压缩</p>
                    </div>
                  )}
                </div>
                <div className="size-info">
                  {compressedSize > 0 ? (
                    <>
                      <span className="size-label">文件大小：</span>
                      <span className="size-value">{(compressedSize / 1024).toFixed(2)} KB</span>
                      <span className="size-ratio">（减少 {compressionRatio}%）</span>
                    </>
                  ) : (
                    <span className="size-placeholder">未压缩</span>
                  )}
                </div>
              </div>
            </div>

            <div className="preview-actions">
              <button className="action-btn secondary" onClick={() => {
                setPreview(null)
                setSelectedFile(null)
                setCompressed(null)
                setOriginalSize(0)
                setCompressedSize(0)
                setQuality(80)
              }}>
                重新选择
              </button>
              <button className="action-btn primary" onClick={handleCompress}>
                开始压缩
              </button>
              {compressed && (
                <button className="action-btn success">
                  下载压缩图片
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
              <span className="info-label">原始大小：</span>
              <span className="info-value">{(originalSize / 1024).toFixed(2)} KB</span>
            </div>
            {compressedSize > 0 && (
              <div className="info-item">
                <span className="info-label">压缩后大小：</span>
                <span className="info-value">{(compressedSize / 1024).toFixed(2)} KB</span>
              </div>
            )}
            {compressedSize > 0 && (
              <div className="info-item">
                <span className="info-label">压缩率：</span>
                <span className="info-value highlight">{compressionRatio}%</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CompressImage

