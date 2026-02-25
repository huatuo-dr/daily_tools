import './Sidebar.css'
import githubIcon from '../../assets/icons/github.png'

const GITHUB_URL = 'https://github.com/huatuo-dr/daily_tools'

const Sidebar = ({ activeTab, onTabChange, collapsed, onToggle }) => {
  const tabs = [
    { id: 'coding', label: 'Coding', icon: '💻' },
    { id: 'weather', label: '天气', icon: '☀️' },
    { id: 'calendar', label: '日历', icon: '📅' },
    { id: 'news', label: '新闻', icon: '📰' },
    { id: 'moyu', label: 'MOYU', icon: '🐟' },
    { id: 'image', label: '图片', icon: '🖼️' }
  ]

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" onClick={onToggle} title={collapsed ? '展开侧边栏' : '折叠侧边栏'}>
        <h1 className="sidebar-title">
          <span className="title-icon">🛠️</span>
          <span className="title-text">工具集</span>
        </h1>
        <span className="collapse-indicator">
          {collapsed ? '»' : '«'}
        </span>
      </div>
      <nav className="sidebar-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            title={collapsed ? tab.label : ''}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <a
          className="sidebar-link"
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? 'GitHub' : ''}
        >
          <img className="tab-icon github-icon" src={githubIcon} alt="GitHub" />
          <span className="tab-label">GitHub</span>
          <span className="external-icon">↗</span>
        </a>
      </div>
    </aside>
  )
}

export default Sidebar

