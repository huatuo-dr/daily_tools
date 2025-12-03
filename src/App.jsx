import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar/Sidebar'
import Coding from './components/Coding/Coding'
import Weather from './components/Weather/Weather'
import Calendar from './components/Calendar/Calendar'
import News from './components/News/News'

function App() {
  const [activeTab, setActiveTab] = useState('coding')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Render active tool component
  const renderToolContent = () => {
    switch (activeTab) {
      case 'coding':
        return <Coding />
      case 'weather':
        return <Weather />
      case 'calendar':
        return <Calendar />
      case 'news':
        return <News />
      default:
        return <Coding />
    }
  }

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="content">
        {renderToolContent()}
      </main>
    </div>
  )
}

export default App

