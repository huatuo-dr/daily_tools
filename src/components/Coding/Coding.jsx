import { useState } from 'react'
import './Coding.css'
import Calculator from './Calculator'
import StringTools from './StringTools'
import JsonValidator from './JsonValidator'

const Coding = () => {
  const [activeSubTab, setActiveSubTab] = useState('calculator')

  const subTabs = [
    { id: 'calculator', label: '计算器', icon: '🔢' },
    { id: 'string', label: '字符串处理', icon: '📝' },
    { id: 'json', label: 'JSON校验', icon: '{ }' }
  ]

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'calculator':
        return <Calculator />
      case 'string':
        return <StringTools />
      case 'json':
        return <JsonValidator />
      default:
        return <Calculator />
    }
  }

  return (
    <div className="coding">
      <div className="coding-header">
        <h2 className="coding-title">💻 开发工具</h2>
      </div>

      <div className="coding-sub-tabs">
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

      <div className="coding-content">
        {renderSubContent()}
      </div>
    </div>
  )
}

export default Coding

