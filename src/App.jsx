import { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar/Sidebar'
import Coding from './components/Coding/Coding'
import Weather from './components/Weather/Weather'
import Calendar from './components/Calendar/Calendar'
import News from './components/News/News'

function App() {
  const [activeTab, setActiveTab] = useState('coding')

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
    <div className="app">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="content">
        {renderToolContent()}
      </main>
    </div>
  )
}

export default App

