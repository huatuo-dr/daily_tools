import { useState, useRef, useEffect } from 'react'
import './ImageCrop.css'

const ImageCrop = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [image, setImage] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [flipHorizontal, setFlipHorizontal] = useState(false)
  const [flipVertical, setFlipVertical] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(null)
  
  // Crop area state (in display coordinates)
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(null)
  
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const containerRef = useRef(null)
  const displaySizeRef = useRef({ width: 0, height: 0 })

  const aspectRatios = [
    { label: '自由', value: null },
    { label: '原始比例', value: 'original' },
    { label: '1:1', value: { width: 1, height: 1 } },
    { label: '4:3', value: { width: 4, height: 3 } },
    { label: '3:4', value: { width: 3, height: 4 } },
    { label: '16:9', value: { width: 16, height: 9 } },
    { label: '9:16', value: { width: 9, height: 16 } },
    { label: '21:9', value: { width: 21, height: 9 } },
  ]

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      loadImage(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      loadImage(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const loadImage = (file) => {
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        setPreview(reader.result)
        setRotation(0)
        setFlipHorizontal(false)
        setFlipVertical(false)
        setAspectRatio(null)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  // Calculate display size and initialize crop area
  useEffect(() => {
    if (image && containerRef.current && imageRef.current) {
      // Wait for image to render to get actual display size
      const updateCropArea = () => {
        const imgElement = imageRef.current
        const container = containerRef.current
        
        if (!imgElement || !container) return
        
        // Force a reflow to ensure layout is complete
        void container.offsetHeight
        
        // Get actual displayed image size
        // Use getBoundingClientRect to get the actual rendered size (accounts for transforms)
        const imgRect = imgElement.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        
        // Get displayed dimensions from bounding rect (accounts for any CSS transforms)
        let displayWidth = imgRect.width
        let displayHeight = imgRect.height
        
        // Fallback to clientWidth/clientHeight if bounding rect is unreliable
        if (displayWidth === 0 || displayHeight === 0) {
          displayWidth = imgElement.clientWidth || imgElement.offsetWidth
          displayHeight = imgElement.clientHeight || imgElement.offsetHeight
        }
        
        // If still 0, calculate from natural size and container
        if (displayWidth === 0 || displayHeight === 0) {
          const containerWidth = container.clientWidth - 40 // account for padding
          const containerHeight = container.clientHeight - 40
          const scale = Math.min(
            containerWidth / image.width,
            containerHeight / image.height,
            1
          )
          displayWidth = image.width * scale
          displayHeight = image.height * scale
        }
        
        if (displayWidth === 0 || displayHeight === 0) {
          // Retry after a short delay if image not yet rendered
          setTimeout(updateCropArea, 100)
          return
        }
        
        displaySizeRef.current = { width: displayWidth, height: displayHeight }
        
        // Calculate image offset relative to container
        // This gives us the top-left corner of the displayed image
        const imgOffsetX = imgRect.left - containerRect.left
        const imgOffsetY = imgRect.top - containerRect.top
        
        // Initialize crop area (center, 80% of display size)
        const cropWidth = displayWidth * 0.8
        const cropHeight = displayHeight * 0.8
        
        // Calculate center position - ensure it starts from image's top-left corner
        const cropX = imgOffsetX + (displayWidth - cropWidth) / 2
        const cropY = imgOffsetY + (displayHeight - cropHeight) / 2
        
        // Ensure crop area is within image bounds
        const minX = imgOffsetX
        const minY = imgOffsetY
        const maxX = imgOffsetX + displayWidth - cropWidth
        const maxY = imgOffsetY + displayHeight - cropHeight
        
        // Clamp to ensure crop area stays within image
        const finalX = Math.max(minX, Math.min(cropX, maxX))
        const finalY = Math.max(minY, Math.min(cropY, maxY))
        
        setCropArea({
          x: finalX,
          y: finalY,
          width: cropWidth,
          height: cropHeight
        })
      }
      
      // Wait for image to load and render
      // Use multiple strategies to ensure we get the correct size
      const img = imageRef.current
      if (img.complete && img.naturalWidth > 0) {
        // Image already loaded
        setTimeout(updateCropArea, 100)
      } else {
        // Wait for image to load
        const onImageLoad = () => {
          setTimeout(updateCropArea, 100)
        }
        img.addEventListener('load', onImageLoad)
        // Fallback timeout
        setTimeout(updateCropArea, 300)
        
        return () => {
          img.removeEventListener('load', onImageLoad)
        }
      }
    }
  }, [image, preview, rotation, flipHorizontal, flipVertical])

  // Update crop area when aspect ratio changes
  useEffect(() => {
    if (aspectRatio && cropArea.width > 0 && cropArea.height > 0 && image) {
      let targetRatio
      
      // Handle 'original' aspect ratio
      if (aspectRatio === 'original') {
        // Use image's natural aspect ratio
        targetRatio = image.width / image.height
      } else if (aspectRatio && typeof aspectRatio === 'object') {
        // Use provided aspect ratio
        targetRatio = aspectRatio.width / aspectRatio.height
      } else {
        return
      }
      
      const currentRatio = cropArea.width / cropArea.height
      
      if (Math.abs(currentRatio - targetRatio) > 0.01) {
        let newWidth = cropArea.width
        let newHeight = cropArea.height
        
        if (currentRatio > targetRatio) {
          newWidth = cropArea.height * targetRatio
        } else {
          newHeight = cropArea.width / targetRatio
        }
        
        // Keep center point
        const centerX = cropArea.x + cropArea.width / 2
        const centerY = cropArea.y + cropArea.height / 2
        
        // Get image position relative to container
        if (imageRef.current && containerRef.current) {
          const imgRect = imageRef.current.getBoundingClientRect()
          const containerRect = containerRef.current.getBoundingClientRect()
          const imgOffsetX = imgRect.left - containerRect.left
          const imgOffsetY = imgRect.top - containerRect.top
          const imgDisplayWidth = imageRef.current.clientWidth || imageRef.current.offsetWidth
          const imgDisplayHeight = imageRef.current.clientHeight || imageRef.current.offsetHeight
          
          displaySizeRef.current = { width: imgDisplayWidth, height: imgDisplayHeight }
          
          const maxX = imgOffsetX + imgDisplayWidth - newWidth
          const maxY = imgOffsetY + imgDisplayHeight - newHeight
          
          setCropArea({
            x: Math.max(imgOffsetX, Math.min(centerX - newWidth / 2, maxX)),
            y: Math.max(imgOffsetY, Math.min(centerY - newHeight / 2, maxY)),
            width: newWidth,
            height: newHeight
          })
        }
      }
    }
  }, [aspectRatio, image, cropArea.width, cropArea.height])

  const handleMouseDown = (e, type) => {
    e.preventDefault()
    setIsDragging(true)
    setIsResizing(type)
    const rect = containerRef.current.getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current || !imageRef.current) return
    
    const container = containerRef.current
    const imgElement = imageRef.current
    const containerRect = container.getBoundingClientRect()
    const imgRect = imgElement.getBoundingClientRect()
    
    // Calculate image position relative to container (same as initialization)
    const imgOffsetX = imgRect.left - containerRect.left
    const imgOffsetY = imgRect.top - containerRect.top
    
    // Get displayed dimensions from bounding rect (accounts for transforms)
    let imgDisplayWidth = imgRect.width
    let imgDisplayHeight = imgRect.height
    
    // Fallback to clientWidth/clientHeight if needed
    if (imgDisplayWidth === 0 || imgDisplayHeight === 0) {
      imgDisplayWidth = imgElement.clientWidth || imgElement.offsetWidth
      imgDisplayHeight = imgElement.clientHeight || imgElement.offsetHeight
    }
    
    const currentX = e.clientX - containerRect.left
    const currentY = e.clientY - containerRect.top
    const deltaX = currentX - dragStart.x
    const deltaY = currentY - dragStart.y
    
    // Update display size ref
    displaySizeRef.current = { width: imgDisplayWidth, height: imgDisplayHeight }
    
    if (isResizing === 'move') {
      // Move crop area
      // Calculate boundaries
      const minX = imgOffsetX
      const minY = imgOffsetY
      const maxX = imgOffsetX + imgDisplayWidth - cropArea.width
      const maxY = imgOffsetY + imgDisplayHeight - cropArea.height
      
      setCropArea(prev => {
        const newX = prev.x + deltaX
        const newY = prev.y + deltaY
        
        // Clamp to image boundaries
        const clampedX = Math.max(minX, Math.min(newX, maxX))
        const clampedY = Math.max(minY, Math.min(newY, maxY))
        
        return {
          ...prev,
          x: clampedX,
          y: clampedY
        }
      })
    } else if (isResizing) {
      // Resize crop area
      const minX = imgOffsetX
      const minY = imgOffsetY
      const maxX = imgOffsetX + imgDisplayWidth
      const maxY = imgOffsetY + imgDisplayHeight
      
      // Calculate target ratio
      let targetRatio = null
      if (aspectRatio === 'original' && image) {
        targetRatio = image.width / image.height
      } else if (aspectRatio && typeof aspectRatio === 'object') {
        targetRatio = aspectRatio.width / aspectRatio.height
      }
      
      let newArea = { ...cropArea }
      
      switch (isResizing) {
        case 'tl':
          newArea.x = Math.max(minX, cropArea.x + deltaX)
          newArea.y = Math.max(minY, cropArea.y + deltaY)
          newArea.width = cropArea.width - deltaX
          newArea.height = cropArea.height - deltaY
          break
        case 'tr':
          newArea.y = Math.max(minY, cropArea.y + deltaY)
          newArea.width = Math.min(maxX - cropArea.x, cropArea.width + deltaX)
          newArea.height = cropArea.height - deltaY
          break
        case 'bl':
          newArea.x = Math.max(minX, cropArea.x + deltaX)
          newArea.width = cropArea.width - deltaX
          newArea.height = Math.min(maxY - cropArea.y, cropArea.height + deltaY)
          break
        case 'br':
          newArea.width = Math.min(maxX - cropArea.x, cropArea.width + deltaX)
          newArea.height = Math.min(maxY - cropArea.y, cropArea.height + deltaY)
          break
      }
      
      // Maintain aspect ratio if set
      if (targetRatio && newArea.width > 20 && newArea.height > 20) {
        const newRatio = newArea.width / newArea.height
        if (Math.abs(newRatio - targetRatio) > 0.01) {
          if (isResizing === 'tl' || isResizing === 'bl') {
            newArea.width = newArea.height * targetRatio
            newArea.x = cropArea.x + cropArea.width - newArea.width
          } else {
            newArea.height = newArea.width / targetRatio
            if (isResizing === 'tr') {
              newArea.y = cropArea.y + cropArea.height - newArea.height
            }
          }
        }
      }
      
      // Ensure minimum size and within bounds
      if (newArea.width > 20 && newArea.height > 20) {
        const finalMaxX = maxX - newArea.width
        const finalMaxY = maxY - newArea.height
        newArea.x = Math.max(minX, Math.min(newArea.x, finalMaxX))
        newArea.y = Math.max(minY, Math.min(newArea.y, finalMaxY))
        setCropArea(newArea)
      }
    }
    
    setDragStart({ x: currentX, y: currentY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(null)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, cropArea, dragStart])

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleFlipHorizontal = () => {
    setFlipHorizontal((prev) => !prev)
  }

  const handleFlipVertical = () => {
    setFlipVertical((prev) => !prev)
  }

  const getImageStyle = () => {
    const transforms = []
    
    if (rotation !== 0) {
      transforms.push(`rotate(${rotation}deg)`)
    }
    
    if (flipHorizontal || flipVertical) {
      transforms.push(`scale(${flipHorizontal ? -1 : 1}, ${flipVertical ? -1 : 1})`)
    }
    
    return {
      transform: transforms.join(' ')
    }
  }

  const handleCrop = () => {
    if (!image || !canvasRef.current || !imageRef.current || !containerRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const imgElement = imageRef.current
    const container = containerRef.current
    
    // Get actual displayed image size and position
    const containerRect = container.getBoundingClientRect()
    const imgRect = imgElement.getBoundingClientRect()
    const imgDisplayWidth = imgElement.clientWidth || imgElement.offsetWidth
    const imgDisplayHeight = imgElement.clientHeight || imgElement.offsetHeight
    const imgOffsetX = imgRect.left - containerRect.left
    const imgOffsetY = imgRect.top - containerRect.top
    
    // Calculate scale from display to original
    const scaleX = image.width / imgDisplayWidth
    const scaleY = image.height / imgDisplayHeight
    
    // Transform crop area back to original image coordinates
    const cropX = (cropArea.x - imgOffsetX) * scaleX
    const cropY = (cropArea.y - imgOffsetY) * scaleY
    const cropWidth = cropArea.width * scaleX
    const cropHeight = cropArea.height * scaleY
    
    // Create a temporary canvas to apply transformations
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = image.width
    tempCanvas.height = image.height
    const tempCtx = tempCanvas.getContext('2d')
    
    // Apply transformations
    tempCtx.save()
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2)
    tempCtx.rotate((rotation * Math.PI) / 180)
    tempCtx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1)
    tempCtx.drawImage(image, -image.width / 2, -image.height / 2)
    tempCtx.restore()
    
    // Calculate crop coordinates after rotation
    let finalCropX = cropX
    let finalCropY = cropY
    let finalCropWidth = cropWidth
    let finalCropHeight = cropHeight
    
    // Transform crop coordinates based on rotation
    if (rotation === 90) {
      finalCropX = image.height - cropY - cropHeight
      finalCropY = cropX
      finalCropWidth = cropHeight
      finalCropHeight = cropWidth
    } else if (rotation === 180) {
      finalCropX = image.width - cropX - cropWidth
      finalCropY = image.height - cropY - cropHeight
    } else if (rotation === 270) {
      finalCropX = cropY
      finalCropY = image.width - cropX - cropWidth
      finalCropWidth = cropHeight
      finalCropHeight = cropWidth
    }
    
    // Ensure crop area is within bounds
    finalCropX = Math.max(0, Math.min(finalCropX, tempCanvas.width - finalCropWidth))
    finalCropY = Math.max(0, Math.min(finalCropY, tempCanvas.height - finalCropHeight))
    finalCropWidth = Math.min(finalCropWidth, tempCanvas.width - finalCropX)
    finalCropHeight = Math.min(finalCropHeight, tempCanvas.height - finalCropY)
    
    // Set output canvas size
    canvas.width = finalCropWidth
    canvas.height = finalCropHeight
    
    // Draw cropped portion
    ctx.drawImage(
      tempCanvas,
      finalCropX,
      finalCropY,
      finalCropWidth,
      finalCropHeight,
      0,
      0,
      finalCropWidth,
      finalCropHeight
    )
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, '')
        a.download = `${fileName}_cropped.${selectedFile.type.split('/')[1]}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }, selectedFile.type, 0.95)
  }

  return (
    <div className="image-crop">
      <div className="tool-header">
        <h3 className="tool-title">✂️ 图片剪裁</h3>
        <p className="tool-description">上传图片，选择需要剪裁的区域，支持旋转和翻转</p>
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
              <p className="upload-hint">支持 JPG、PNG、GIF 等格式</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="file-input"
                id="crop-file-input"
              />
              <label htmlFor="crop-file-input" className="upload-btn">
                选择文件
              </label>
            </div>
          </div>
        ) : (
          <div className="preview-container">
            <div className="crop-controls">
              <div className="control-group">
                <label className="control-label">预设比例：</label>
                <div className="aspect-ratio-buttons">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.label}
                      className={`aspect-btn ${aspectRatio === ratio.value ? 'active' : ''}`}
                      onClick={() => setAspectRatio(ratio.value)}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="control-group">
                <label className="control-label">变换操作：</label>
                <div className="transform-buttons">
                  <button 
                    className={`transform-btn ${rotation !== 0 ? 'active' : ''}`}
                    onClick={handleRotate} 
                    title="旋转90度"
                  >
                    🔄 旋转 ({rotation}°)
                  </button>
                  <button 
                    className={`transform-btn ${flipHorizontal ? 'active' : ''}`}
                    onClick={handleFlipHorizontal} 
                    title="水平翻转"
                  >
                    ↔️ 水平翻转
                  </button>
                  <button 
                    className={`transform-btn ${flipVertical ? 'active' : ''}`}
                    onClick={handleFlipVertical} 
                    title="垂直翻转"
                  >
                    ↕️ 垂直翻转
                  </button>
                </div>
              </div>
            </div>

            <div 
              className="image-preview-container has-image"
              ref={containerRef}
            >
              <div className="image-preview-wrapper">
                <img
                  ref={imageRef}
                  src={preview}
                  alt="Preview"
                  className="preview-image"
                  style={getImageStyle()}
                />
              </div>
              {cropArea.width > 0 && cropArea.height > 0 && (
                <div
                  className="crop-overlay"
                  style={{
                    left: `${cropArea.x}px`,
                    top: `${cropArea.y}px`,
                    width: `${cropArea.width}px`,
                    height: `${cropArea.height}px`
                  }}
                >
                  <div
                    className="crop-box"
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                  >
                    <div
                      className="crop-handle crop-handle-tl"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, 'tl')
                      }}
                    ></div>
                    <div
                      className="crop-handle crop-handle-tr"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, 'tr')
                      }}
                    ></div>
                    <div
                      className="crop-handle crop-handle-bl"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, 'bl')
                      }}
                    ></div>
                    <div
                      className="crop-handle crop-handle-br"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleMouseDown(e, 'br')
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            
            <div className="preview-actions">
              <button className="action-btn secondary" onClick={() => {
                setPreview(null)
                setSelectedFile(null)
                setImage(null)
                setRotation(0)
                setFlipHorizontal(false)
                setFlipVertical(false)
                setAspectRatio(null)
              }}>
                重新选择
              </button>
              <button className="action-btn primary" onClick={handleCrop}>
                确认剪裁并下载
              </button>
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
            {image && (
              <div className="info-item">
                <span className="info-label">图片尺寸：</span>
                <span className="info-value">{image.width} × {image.height}</span>
              </div>
            )}
            {rotation !== 0 && (
              <div className="info-item">
                <span className="info-label">旋转角度：</span>
                <span className="info-value">{rotation}°</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ImageCrop
