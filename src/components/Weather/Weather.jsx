import { useState, useEffect } from 'react'
import './Weather.css'
import { getMockWeatherData } from '../../utils/mockData'
import { getWeatherData, getUserCity } from '../../utils/weatherApi'
import HourlyForecast from './HourlyForecast'
import CitySelector from './CitySelector'

const Weather = () => {
  const [location, setLocation] = useState('杭州')
  const [weatherData, setWeatherData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [locationDetected, setLocationDetected] = useState(false)

  useEffect(() => {
    // Try to get user's location automatically
    initializeLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only load once on component mount

  const initializeLocation = async () => {
    setIsLoading(true)
    
    try {
      // Try to get user's city from geolocation
      console.log('🔍 开始自动定位...')
      const userCity = await getUserCity()
      console.log('✅ 定位成功:', userCity)
      setLocation(userCity)
      setLocationDetected(true)
      await loadWeatherData(userCity)
    } catch (geoError) {
      // Geolocation failed, use default city (Hangzhou)
      console.warn('❌ 定位失败，使用默认城市（杭州）')
      console.warn('失败原因:', geoError.message)
      console.warn('提示: 请在浏览器中允许位置权限，或手动选择城市')
      setLocationDetected(false)
      await loadWeatherData('杭州')
    }
  }

  // Convert QWeather API data to our format
  const convertWeatherData = (apiData) => {
    const today = apiData.daily[0]
    
    return {
      location: apiData.location.name,
      current: {
        temperature: apiData.current.temp,
        condition: apiData.current.text,
        icon: getWeatherIcon(apiData.current.icon),
        humidity: apiData.current.humidity,
        wind: `${apiData.current.windScale}级`,
        rainProbability: apiData.hourly[0]?.pop || '0', // Use first hour's precipitation probability
        high: today.tempMax,
        low: today.tempMin,
      },
      hourly: apiData.hourly.slice(0, 24).map((hour, index) => {
        // Parse time safely: "2025-12-01T11:00+08:00"
        let displayTime = '00:00';
        
        if (hour.time) {
          // Extract hour from ISO format string: "2025-12-01T11:00+08:00"
          const timeMatch = hour.time.match(/T(\d{2}):/);
          if (timeMatch && timeMatch[1]) {
            displayTime = `${timeMatch[1]}:00`;
          } else {
            // Fallback to Date parsing
            try {
              const date = new Date(hour.time);
              if (!isNaN(date.getTime())) {
                const hours = date.getHours();
                displayTime = `${hours}:00`;
              }
            } catch (e) {
              console.warn('Failed to parse time:', hour.time, e);
            }
          }
        }
        
        return {
          displayTime,
          temperature: parseFloat(hour.temp),
          rainProbability: parseFloat(hour.pop),
        };
      }),
      forecast: apiData.daily.map(day => ({
        date: formatDate(day.date),
        weekday: getWeekday(day.date),
        icon: getWeatherIcon(day.iconDay),
        condition: day.textDay,
        high: day.tempMax,
        low: day.tempMin,
        wind: `${day.windScaleDay}级`,
        rainProbability: Math.round(parseFloat(day.precip) * 10) || '0', // Convert precip to percentage
      })),
    }
  }

  // Get weather icon emoji based on QWeather icon code
  const getWeatherIcon = (iconCode) => {
    const iconMap = {
      '100': '☀️', '101': '⛅', '102': '⛅', '103': '☁️', '104': '☁️',
      '150': '☀️', '151': '⛅', '152': '⛅', '153': '☁️',
      '300': '🌦️', '301': '🌧️', '302': '⛈️', '303': '⛈️', '304': '⛈️',
      '305': '🌧️', '306': '🌧️', '307': '🌧️', '308': '🌧️', '309': '🌧️',
      '310': '🌧️', '311': '🌧️', '312': '🌧️', '313': '🌧️', '314': '🌧️',
      '315': '🌧️', '316': '🌧️', '317': '🌧️', '318': '🌧️',
      '350': '🌧️', '351': '🌧️',
      '400': '🌨️', '401': '🌨️', '402': '🌨️', '403': '🌨️', '404': '🌨️',
      '405': '🌨️', '406': '🌨️', '407': '🌨️', '408': '🌨️', '409': '🌨️',
      '410': '🌨️', '456': '🌨️', '457': '🌨️', '499': '🌨️',
      '500': '🌫️', '501': '🌫️', '502': '🌫️', '503': '🌫️', '504': '🌫️',
      '507': '🌫️', '508': '🌫️', '509': '🌫️', '510': '🌫️', '511': '🌫️',
      '512': '🌫️', '513': '🌫️', '514': '🌫️', '515': '🌫️',
    }
    return iconMap[iconCode] || '🌤️'
  }

  // Format date from YYYY-MM-DD to MM/DD
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // Get weekday name in Chinese
  const getWeekday = (dateStr) => {
    const date = new Date(dateStr)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  }

  const loadWeatherData = async (city) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Try to fetch real weather data
      const apiData = await getWeatherData(city)
      const formattedData = convertWeatherData(apiData)
      setWeatherData(formattedData)
      setUsingMockData(false)
    } catch (err) {
      console.warn('Failed to fetch real weather data, falling back to mock data:', err)
      
      // Fallback to mock data
      const mockData = getMockWeatherData(city)
      setWeatherData(mockData)
      setUsingMockData(true)
      setError('无法连接天气服务，使用模拟数据')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationChange = (e) => {
    setLocation(e.target.value)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.target.blur() // Remove focus from input
      loadWeatherData(location)
    }
  }

  if (isLoading) {
    return (
      <div className="weather">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  return (
    <div className="weather">
      <div className="weather-header">
        <h2 className="weather-title">天气预报</h2>
        <div className="location-selector-wrapper">
          <CitySelector
            value={location}
            onChange={setLocation}
            onSearch={loadWeatherData}
          />
          {locationDetected && (
            <span className="location-detected-badge" title="已自动定位">📍 已定位</span>
          )}
          {usingMockData && (
            <span className="mock-data-badge" title={error}>⚠️ 模拟数据</span>
          )}
        </div>
      </div>

      {/* Current weather card */}
      <div className="current-weather">
        <div className="current-weather-main">
          <div className="weather-icon">{weatherData.current.icon}</div>
          <div className="temperature-group">
            <div className="temperature">{weatherData.current.temperature}°C</div>
            <div className="temperature-range">
              {weatherData.current.low}° ~ {weatherData.current.high}°
            </div>
          </div>
        </div>
        <div className="current-weather-details">
          <div className="weather-condition">{weatherData.current.condition}</div>
          <div className="weather-meta">
            <div className="meta-item">
              <span className="meta-icon">💧</span>
              <span className="meta-label">湿度</span>
              <span className="meta-value">{weatherData.current.humidity}%</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">🌧️</span>
              <span className="meta-label">降雨</span>
              <span className="meta-value">{weatherData.current.rainProbability}%</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">💨</span>
              <span className="meta-label">风力</span>
              <span className="meta-value">{weatherData.current.wind}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 48-hour forecast */}
      {weatherData.hourly && <HourlyForecast hourlyData={weatherData.hourly} />}

      {/* 15-day forecast */}
      <div className="forecast-section">
        <h3 className="forecast-title">未来15天预报</h3>
        <div className="forecast-list">
          {weatherData.forecast.map((day, index) => (
            <div key={index} className="forecast-item">
              <div className="forecast-date">
                <span className="date-text">{day.date}</span>
                <span className="weekday-text">{day.weekday}</span>
              </div>
              <div className="forecast-icon">{day.icon}</div>
              <div className="forecast-condition">{day.condition}</div>
              <div className="forecast-temp">
                <span className="temp-high">{day.high}°</span>
                <span className="temp-separator">/</span>
                <span className="temp-low">{day.low}°</span>
              </div>
              <div className="forecast-details">
                <div className="forecast-detail-item">
                  <span>💨 {day.wind}</span>
                </div>
                <div className="forecast-detail-item">
                  <span>🌧️ {day.rainProbability}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Weather

