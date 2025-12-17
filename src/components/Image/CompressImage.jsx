import { useState } from 'react'
import './CompressImage.css'

const CompressImage = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [compressed, setCompressed] = useState(null)
  const [compressedBlob, setCompressedBlob] = useState(null)
  const [targetSizeKB, setTargetSizeKB] = useState(512)
  const [outputFormat, setOutputFormat] = useState('jpeg')
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)
  const [isCompressing, setIsCompressing] = useState(false)
  const [error, setError] = useState(null)
  const [currentQuality, setCurrentQuality] = useState(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const fileSizeKB = file.size / 1024
      setOriginalSize(file.size)
      // Set default target size to 50% of original, but at least 100KB and max 2048KB
      const defaultTarget = Math.max(100, Math.min(2048, Math.floor(fileSizeKB * 0.5)))
      setTargetSizeKB(defaultTarget)
      setCompressedSize(0)
      setCompressed(null)
      setCompressedBlob(null)
      setCurrentQuality(null)
      setError(null)
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
      const fileSizeKB = file.size / 1024
      setOriginalSize(file.size)
      // Set default target size to 50% of original, but at least 100KB and max 2048KB
      const defaultTarget = Math.max(100, Math.min(2048, Math.floor(fileSizeKB * 0.5)))
      setTargetSizeKB(defaultTarget)
      setCompressedSize(0)
      setCompressed(null)
      setCompressedBlob(null)
      setCurrentQuality(null)
      setError(null)
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

  // Get MIME type based on output format
  const getMimeType = (format) => {
    switch (format) {
      case 'jpeg':
        return 'image/jpeg'
      case 'png':
        return 'image/png'
      case 'webp':
        return 'image/webp'
      default:
        return 'image/jpeg'
    }
  }

  // Compress image with specific quality and return blob
  const compressWithQuality = async (img, qualityValue) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const mimeType = getMimeType(outputFormat)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('压缩失败'))
          }
        },
        mimeType,
        qualityValue
      )
    })
  }

  // Binary search to find quality that matches target size
  const findQualityForTargetSize = async (img, targetSizeBytes) => {
    // PNG format doesn't support quality adjustment
    if (outputFormat === 'png') {
      const blob = await compressWithQuality(img, 1.0)
      return { blob, quality: 1.0 }
    }

    let minQuality = 0.1
    let maxQuality = 1.0
    let bestBlob = null
    let bestQuality = 0.5
    const tolerance = targetSizeBytes * 0.05 // 5% tolerance
    const maxIterations = 20
    let iterations = 0

    while (iterations < maxIterations) {
      const currentQuality = (minQuality + maxQuality) / 2
      const blob = await compressWithQuality(img, currentQuality)
      const currentSize = blob.size

      // Update best result if closer to target
      if (!bestBlob || Math.abs(currentSize - targetSizeBytes) < Math.abs(bestBlob.size - targetSizeBytes)) {
        bestBlob = blob
        bestQuality = currentQuality
      }

      // Check if we're within tolerance
      if (Math.abs(currentSize - targetSizeBytes) <= tolerance) {
        return { blob, quality: currentQuality }
      }

      // Adjust quality range
      if (currentSize > targetSizeBytes) {
        maxQuality = currentQuality
      } else {
        minQuality = currentQuality
      }

      iterations++
    }

    return { blob: bestBlob, quality: bestQuality }
  }

  // Compress image to target size
  const handleCompress = async () => {
    if (!preview || !selectedFile) return

    // Validate target size
    const targetSizeBytes = targetSizeKB * 1024
    if (targetSizeBytes <= 0) {
      setError('目标大小必须大于 0')
      return
    }

    if (targetSizeBytes >= originalSize) {
      setError('目标大小必须小于原始文件大小')
      return
    }

    setIsCompressing(true)
    setError(null)
    setCompressed(null)
    setCompressedBlob(null)
    setCompressedSize(0)
    setCurrentQuality(null)

    try {
      // Create image element
      const img = new Image()
      img.crossOrigin = 'anonymous'

      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = preview
      })

      // Find quality that matches target size
      const { blob, quality } = await findQualityForTargetSize(img, targetSizeBytes)
      
      // Create data URL for preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setCompressed(reader.result)
        setCompressedBlob(blob)
        setCompressedSize(blob.size)
        setCurrentQuality(Math.round(quality * 100))
        setIsCompressing(false)
      }
      reader.onerror = () => {
        setError('压缩失败，请重试')
        setIsCompressing(false)
      }
      reader.readAsDataURL(blob)
    } catch (err) {
      console.error('Compression error:', err)
      setError('压缩失败：' + (err.message || '未知错误'))
      setIsCompressing(false)
    }
  }

  // Download compressed image
  const handleDownload = () => {
    if (!compressedBlob || !selectedFile) return

    const link = document.createElement('a')
    const url = URL.createObjectURL(compressedBlob)
    link.href = url

    // Generate filename with format extension
    const fileName = selectedFile.name.replace(/\.[^/.]+$/, '')
    const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat
    link.download = `${fileName}_compressed.${extension}`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up object URL
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  const compressionRatio = originalSize > 0 && compressedSize > 0
    ? ((1 - compressedSize / originalSize) * 100).toFixed(1)
    : 0

  return (
    <div className="compress-image">
      <div className="tool-header">
        <h3 className="tool-title">📦 修改体积</h3>
        <p className="tool-description">将图片压缩到指定文件大小（如 512KB）</p>
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
                <label className="control-label">输出格式</label>
                <div className="format-buttons">
                  <button
                    className={`format-btn ${outputFormat === 'jpeg' ? 'active' : ''}`}
                    onClick={() => {
                      setOutputFormat('jpeg')
                      if (compressed) {
                        setCompressed(null)
                        setCompressedBlob(null)
                        setCompressedSize(0)
                        setCurrentQuality(null)
                      }
                    }}
                    disabled={isCompressing}
                  >
                    JPEG
                  </button>
                  <button
                    className={`format-btn ${outputFormat === 'png' ? 'active' : ''}`}
                    onClick={() => {
                      setOutputFormat('png')
                      if (compressed) {
                        setCompressed(null)
                        setCompressedBlob(null)
                        setCompressedSize(0)
                        setCurrentQuality(null)
                      }
                    }}
                    disabled={isCompressing}
                  >
                    PNG
                  </button>
                  <button
                    className={`format-btn ${outputFormat === 'webp' ? 'active' : ''}`}
                    onClick={() => {
                      setOutputFormat('webp')
                      if (compressed) {
                        setCompressed(null)
                        setCompressedBlob(null)
                        setCompressedSize(0)
                        setCurrentQuality(null)
                      }
                    }}
                    disabled={isCompressing}
                  >
                    WEBP
                  </button>
                </div>
              </div>
              <div className="control-item">
                <label className="control-label">目标文件大小（KB）</label>
                <div className="target-size-input-wrapper">
                  <input
                    type="number"
                    min="1"
                    max={Math.floor(originalSize / 1024)}
                    value={targetSizeKB}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      if (!isNaN(value) && value > 0) {
                        const maxSize = Math.floor(originalSize / 1024)
                        if (value <= maxSize) {
                          setTargetSizeKB(value)
                          setError(null)
                        } else {
                          setTargetSizeKB(maxSize)
                          setError(`目标大小不能超过原始大小 ${maxSize} KB`)
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = Number(e.target.value)
                      if (isNaN(value) || value <= 0) {
                        const defaultTarget = Math.max(100, Math.min(2048, Math.floor(originalSize / 1024 * 0.5)))
                        setTargetSizeKB(defaultTarget)
                        setError(null)
                      } else {
                        const maxSize = Math.floor(originalSize / 1024)
                        if (value > maxSize) {
                          setTargetSizeKB(maxSize)
                        }
                      }
                    }}
                    className="target-size-input"
                    disabled={isCompressing}
                    placeholder="512"
                  />
                  <span className="input-unit">KB</span>
                </div>
                <div className="size-hint">
                  <span>原始大小：{(originalSize / 1024).toFixed(2)} KB</span>
                  {targetSizeKB > 0 && (
                    <span className="target-hint">
                      目标：{targetSizeKB} KB（约 {((targetSizeKB / (originalSize / 1024)) * 100).toFixed(1)}%）
                    </span>
                  )}
                </div>
                {outputFormat === 'png' && (
                  <p className="format-hint">⚠️ PNG 格式不支持精确控制文件大小，将使用无损压缩</p>
                )}
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
                      <p>设置目标大小后点击压缩</p>
                    </div>
                  )}
                </div>
                <div className="size-info">
                  {compressedSize > 0 ? (
                    <>
                      <span className="size-label">文件大小：</span>
                      <span className="size-value">{(compressedSize / 1024).toFixed(2)} KB</span>
                      {Math.abs(compressedSize - targetSizeKB * 1024) <= targetSizeKB * 1024 * 0.1 ? (
                        <span className="size-success">✓ 接近目标</span>
                      ) : compressedSize > targetSizeKB * 1024 ? (
                        <span className="size-warning">超出目标 {(compressedSize / 1024 - targetSizeKB).toFixed(2)} KB</span>
                      ) : (
                        <span className="size-info-text">小于目标 {(targetSizeKB - compressedSize / 1024).toFixed(2)} KB</span>
                      )}
                      {currentQuality && (
                        <div className="quality-info">实际质量：{currentQuality}%</div>
                      )}
                    </>
                  ) : (
                    <span className="size-placeholder">未压缩</span>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="preview-actions">
              <button
                className="action-btn secondary"
                onClick={() => {
                  setPreview(null)
                  setSelectedFile(null)
                  setCompressed(null)
                  setCompressedBlob(null)
                  setOriginalSize(0)
                  setCompressedSize(0)
                  setTargetSizeKB(512)
                  setOutputFormat('jpeg')
                  setCurrentQuality(null)
                  setError(null)
                }}
                disabled={isCompressing}
              >
                重新选择
              </button>
              <button
                className="action-btn primary"
                onClick={handleCompress}
                disabled={isCompressing}
              >
                {isCompressing ? '压缩中...' : '开始压缩'}
              </button>
              {compressed && (
                <button className="action-btn success" onClick={handleDownload}>
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
              <>
                <div className="info-item">
                  <span className="info-label">目标大小：</span>
                  <span className="info-value">{targetSizeKB} KB</span>
                </div>
                <div className="info-item">
                  <span className="info-label">压缩率：</span>
                  <span className="info-value highlight">{compressionRatio}%</span>
                </div>
                {currentQuality && (
                  <div className="info-item">
                    <span className="info-label">实际质量：</span>
                    <span className="info-value">{currentQuality}%</span>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CompressImage

