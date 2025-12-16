import { useState } from 'react'
import './Image.css'
import ImageCrop from './ImageCrop'
import RemoveBackground from './RemoveBackground'
import RemoveWatermark from './RemoveWatermark'
import CompressImage from './CompressImage'

const Image = () => {
  const [activeSubTab, setActiveSubTab] = useState('crop')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const subTabs = [
    { id: 'crop', label: '剪裁', icon: '✂️' },
    { id: 'background', label: '去背景', icon: '🎭' },
    { id: 'watermark', label: '去水印', icon: '💧' },
    { id: 'compress', label: '修改体积', icon: '📦' }
  ]

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'crop':
        return <ImageCrop />
      case 'background':
        return <RemoveBackground />
      case 'watermark':
        return <RemoveWatermark />
      case 'compress':
        return <CompressImage />
      default:
        return <ImageCrop />
    }
  }

  // Get current active tab info for collapsed display
  const activeTab = subTabs.find(tab => tab.id === activeSubTab)

  return (
    <div className={`image-tools ${isCollapsed ? 'collapsed' : ''}`}>
      <div className={`image-top ${isCollapsed ? 'hidden' : ''}`}>
        <div className="image-header">
          <h2 className="image-title">🖼️ 图片工具</h2>
        </div>

        <div className="image-sub-tabs">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              className={`sub-tab ${activeSubTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSubTab(tab.id)}
            >
              <span className="sub-tab-icon">{tab.icon}</span>
              <span className="sub-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        className="collapse-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? '展开工具栏' : '折叠工具栏'}
      >
        {isCollapsed ? (
          <>
            <span className="collapse-icon">▼</span>
            <span className="collapse-label">{activeTab?.icon} {activeTab?.label}</span>
          </>
        ) : (
          <span className="collapse-icon">▲</span>
        )}
      </button>

      <div className="image-content">
        {renderSubContent()}
      </div>
    </div>
  )
}

export default Image

