import { useState } from 'react'
import './Coding.css'
import Calculator from './Calculator'
import StringTools from './StringTools'
import JsonValidator from './JsonValidator'
import RegexTester from './RegexTester'
import ShellTranslate from './ShellTranslate'
import IpLookup from './IpLookup'

const Coding = () => {
  const [activeSubTab, setActiveSubTab] = useState('shell')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const subTabs = [
    { id: 'shell', label: '命令翻译', icon: '🔧' },
    { id: 'calculator', label: '计算器', icon: '🔢' },
    { id: 'string', label: '字符串处理', icon: '📝' },
    { id: 'json', label: 'JSON校验', icon: '{ }' },
    { id: 'regex', label: '正则测试', icon: '🔍' },
    { id: 'ip', label: 'IP查询', icon: '🌐' }
  ]

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'calculator':
        return <Calculator />
      case 'string':
        return <StringTools />
      case 'json':
        return <JsonValidator />
      case 'regex':
        return <RegexTester />
      case 'shell':
        return <ShellTranslate />
      case 'ip':
        return <IpLookup />
      default:
        return <Calculator />
    }
  }

  // Get current active tab info for collapsed display
  const activeTab = subTabs.find(tab => tab.id === activeSubTab)

  return (
    <div className={`coding ${isCollapsed ? 'collapsed' : ''}`}>
      <div className={`coding-top ${isCollapsed ? 'hidden' : ''}`}>
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

      <div className="coding-content">
        {renderSubContent()}
      </div>
    </div>
  )
}

export default Coding


