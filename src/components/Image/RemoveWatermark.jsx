/* global cv */
import { useState, useRef, useEffect, useCallback } from 'react'
// import { loadOpenCV } from '../../utils/opencvLoader' // Removed in favor of worker
import './RemoveWatermark.css'

const RemoveWatermark = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [isCvLoaded, setIsCvLoaded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [brushSize, setBrushSize] = useState(20)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isLoadingCv, setIsLoadingCv] = useState(false)

  const imageRef = useRef(null)
  const canvasRef = useRef(null)
  const cursorRef = useRef(null) // Ref for custom cursor
  const lastPos = useRef({ x: 0, y: 0 })
  const workerRef = useRef(null)

  // Initialize Worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('../../utils/cv.worker.js', import.meta.url));

    workerRef.current.onmessage = (e) => {
      const { type, success, payload, error } = e.data;

      if (type === 'load') {
        setIsLoadingCv(false);
        if (success) {
          setIsCvLoaded(true);
          console.log('Worker: OpenCV loaded');
        } else {
          console.error('Worker: Failed to load OpenCV', error);
          alert('资源加载失败: ' + error);
        }
      }
      else if (type === 'process') {
        setIsProcessing(false);
        if (success) {
          // Convert pixels back to ImageData -> Canvas -> DataURL
          const { pixels, width, height } = payload;
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height);
          ctx.putImageData(imageData, 0, 0);
          setResult(canvas.toDataURL());
        } else {
          console.error('Worker: Processing failed', error);
          alert('处理失败: ' + error);
        }
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // REMOVED auto-loading to prevent freeze on mount
  // useEffect(() => {
  //   loadOpenCV().then...
  // }, [])

  const handleLoadCv = () => {
    setIsLoadingCv(true)
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'load' });
    }
  }

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (canvas && image) {
      // Use natural dimensions for full resolution
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
      ctx.lineWidth = brushSize
    }
  }, [brushSize])

  // Update canvas size when preview image loads
  useEffect(() => {
    if (preview && imageRef.current) {
      // Small delay to ensure image dimensions are ready
      setTimeout(initCanvas, 100)
    }
  }, [preview, initCanvas])

  // Update cursor size whenever brush size changes or preview loads
  const updateCursorSize = useCallback(() => {
    const cursor = cursorRef.current
    const image = imageRef.current

    if (cursor && image) {
      // Calculate visual scale ratio: Rendered Width / Natural Width
      // Note: image.width is the rendered width (layout width)
      const scale = image.width / image.naturalWidth
      const visualSize = brushSize * scale

      cursor.style.width = `${visualSize}px`
      cursor.style.height = `${visualSize}px`
    }
  }, [brushSize])

  // Call updateCursorSize when brushSize changes
  useEffect(() => {
    updateCursorSize()

    // Also update canvas context
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.lineWidth = brushSize
    }
  }, [brushSize, updateCursorSize])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
        setResult(null)
        // Auto load CV if not loaded
        if (!isCvLoaded && !isLoadingCv) {
          handleLoadCv()
        }
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
        // Auto load CV if not loaded
        if (!isCvLoaded && !isLoadingCv) {
          handleLoadCv()
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  // Drawing handlers
  const getMousePos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    // Map visual coordinates (0..rect.width) to canvas internal coordinates (0..naturalWidth)
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      // Pass raw client coords for cursor positioning
      clientX: e.clientX,
      clientY: e.clientY,
      rectLeft: rect.left,
      rectTop: rect.top
    }
  }

  const updateCursorPos = (e) => {
    const cursor = cursorRef.current
    const canvas = canvasRef.current
    if (cursor && canvas) {
      const rect = canvas.getBoundingClientRect()
      // Position cursor relative to the wrapper (which is relative positioned)
      // e.clientX is global, rect.left is global.
      // Offset inside wrapper = e.clientX - rect.left
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      cursor.style.left = `${x}px`
      cursor.style.top = `${y}px`
      cursor.style.display = 'block'
    }
  }

  const startDrawing = (e) => {
    setIsDrawing(true)
    const pos = getMousePos(e)
    lastPos.current = pos

    updateCursorPos(e) // Update cursor visually

    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
    ctx.fill()
  }

  const draw = (e) => {
    if (isDrawing) {
      const pos = getMousePos(e)
      const ctx = canvasRef.current.getContext('2d')

      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()

      lastPos.current = pos
    }
    updateCursorPos(e) // Always update cursor position on move
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const handleMouseEnter = () => {
    if (cursorRef.current) cursorRef.current.style.display = 'block'
    updateCursorSize() // Refine size on enter just in case
  }

  const handleMouseLeave = () => {
    setIsDrawing(false)
    if (cursorRef.current) cursorRef.current.style.display = 'none'
  }

  const clearMask = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleProcess = async () => {
    if (!workerRef.current || !isCvLoaded) {
      alert('请先加载插件')
      return
    }

    setIsProcessing(true)

    try {
      // 1. Get Image Pixel Data
      // We need to draw the original image to a temp canvas to extract InitPiexelData
      const tempCanvas = document.createElement('canvas');
      const img = imageRef.current;
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      const ctx = tempCanvas.getContext('2d');
      // drawImage(image, 0, 0) draws strictly at natural size if no width/height args
      ctx.drawImage(img, 0, 0);
      const imagePixels = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);

      // 2. Get Mask Pixel Data
      const maskCtx = canvasRef.current.getContext('2d');
      const maskPixels = maskCtx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);

      // 3. Send to worker
      workerRef.current.postMessage({
        type: 'process',
        payload: {
          imagePixels: imagePixels,
          maskPixels: maskPixels,
          width: img.naturalWidth,
          height: img.naturalHeight
        }
      }, [imagePixels.data.buffer, maskPixels.data.buffer]); // Transfer buffers

    } catch (err) {
      console.error('Processing prep error:', err)
      alert('处理出错，请重试')
      setIsProcessing(false)
    }
  }

  return (
    <div className="remove-watermark">
      <div className="tool-header">
        <h3 className="tool-title">💧 去除水印</h3>
        <p className="tool-description">涂抹图片中的水印，智能算法自动修复</p>
      </div>

      <div className="upload-area">
        {!preview ? (
          <div
            className="rw-drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="rw-drop-zone-content">
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
            <div className="toolbar">
              <div className="tool-control">
                <label>笔刷大小: {brushSize}px</label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
              </div>
              <button className="action-btn secondary small" onClick={clearMask}>
                清除涂抹
              </button>
            </div>

            <div className="rw-image-comparison">
              <div className="rw-comparison-item">
                <h4 className="comparison-label">
                  涂抹水印区域
                  {!isCvLoaded && (
                    <button
                      className="action-btn small primary"
                      onClick={handleLoadCv}
                      disabled={isLoadingCv}
                      style={{ marginLeft: '10px' }}
                    >
                      {isLoadingCv ? '加载中...' : '加载插件'}
                    </button>
                  )}
                </h4>
                <div className="rw-image-wrapper">
                  <div className="rw-content-wrap">
                    <img
                      ref={imageRef}
                      src={preview}
                      alt="Original"
                      onLoad={initCanvas}
                    />
                    <canvas
                      ref={canvasRef}
                      className="rw-drawing-canvas"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    />
                    <div ref={cursorRef} className="brush-cursor" />
                  </div>
                </div>
              </div>
              <div className="rw-comparison-item">
                <h4 className="comparison-label">处理后</h4>
                <div className="rw-image-wrapper">
                  {isProcessing ? (
                    <div className="processing-indicator">
                      <div className="spinner"></div>
                      <p>正在修复中...</p>
                    </div>
                  ) : result ? (
                    <div className="rw-content-wrap">
                      <img src={result} alt="Processed" />
                    </div>
                  ) : (
                    <div className="placeholder-result">
                      <span className="placeholder-icon">✨</span>
                      <p>涂抹水印后点击处理</p>
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
                // Cleanup canvas if needed
              }}>
                重新选择
              </button>
              <button
                className="action-btn primary"
                onClick={handleProcess}
                disabled={!isCvLoaded || isProcessing}
              >
                {isProcessing ? '处理中...' : '开始处理'}
              </button>
              {result && (
                <button className="action-btn success" onClick={() => {
                  const link = document.createElement('a')
                  link.href = result
                  link.download = `watermark_removed_${Date.now()}.png`
                  link.click()
                }}>
                  下载结果
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="tool-info">
        {preview && (
          <div className="info-item">
            <span className="info-label">状态：</span>
            <span className="info-value">
              {isCvLoaded ? '模型已就绪' : '正在加载模型资源...'}
            </span>
          </div>
        )}
        {selectedFile && (
          <div className="info-item">
            <span className="info-label">当前图片：</span>
            <span className="info-value">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default RemoveWatermark


