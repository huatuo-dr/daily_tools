import './Sidebar.css'

const Sidebar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'coding', label: 'Coding', icon: '💻' },
    { id: 'weather', label: '天气', icon: '☀️' },
    { id: 'calendar', label: '日历', icon: '📅' },
    { id: 'news', label: '新闻', icon: '📰' }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-title">🛠️ 工具集</h1>
      </div>
      <nav className="sidebar-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar

