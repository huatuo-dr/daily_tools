// Mock weather data for development
// TODO: Replace with real weather API (OpenWeatherMap, etc.)

const weatherConditions = [
  { condition: '晴', icon: '☀️' },
  { condition: '多云', icon: '⛅' },
  { condition: '阴', icon: '☁️' },
  { condition: '小雨', icon: '🌦️' },
  { condition: '雨', icon: '🌧️' },
  { condition: '雪', icon: '❄️' },
]

const windLevels = ['无风', '微风', '3级', '4级', '5级', '6级']

/**
 * Generate mock weather data for a given city
 * @param {string} city - City name
 * @returns {Object} Weather data object
 */
export const getMockWeatherData = (city = '北京') => {
  // Generate random but reasonable weather data
  const currentCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)]
  const baseTemp = Math.floor(Math.random() * 20) + 10 // 10-30°C
  const currentHigh = baseTemp + Math.floor(Math.random() * 8)
  const currentLow = currentHigh - Math.floor(Math.random() * 10) - 5
  
  const forecast = []
  const today = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  for (let i = 0; i < 15; i++) {
    const forecastDate = new Date(today)
    forecastDate.setDate(today.getDate() + i)

    const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)]
    const high = baseTemp + Math.floor(Math.random() * 8) - 2
    const low = high - Math.floor(Math.random() * 10) - 5

    // Calculate rain probability based on condition
    let rainProbability = 0
    if (condition.condition.includes('雨')) {
      rainProbability = Math.floor(Math.random() * 30) + 60 // 60-90%
    } else if (condition.condition.includes('云') || condition.condition.includes('阴')) {
      rainProbability = Math.floor(Math.random() * 30) + 20 // 20-50%
    } else {
      rainProbability = Math.floor(Math.random() * 20) // 0-20%
    }

    forecast.push({
      date: `${forecastDate.getMonth() + 1}/${forecastDate.getDate()}`,
      weekday: weekdays[forecastDate.getDay()],
      icon: condition.icon,
      condition: condition.condition,
      high,
      low,
      wind: windLevels[Math.floor(Math.random() * windLevels.length)],
      rainProbability
    })
  }
  
  // Calculate current rain probability
  let currentRainProbability = 0
  if (currentCondition.condition.includes('雨')) {
    currentRainProbability = Math.floor(Math.random() * 30) + 60
  } else if (currentCondition.condition.includes('云') || currentCondition.condition.includes('阴')) {
    currentRainProbability = Math.floor(Math.random() * 30) + 20
  } else {
    currentRainProbability = Math.floor(Math.random() * 20)
  }
  
  // Generate 48 hours hourly data
  const hourly = []
  const now = new Date()
  const currentTemp = baseTemp + Math.floor(Math.random() * 5)
  
  for (let i = 0; i < 48; i++) {
    const hour = new Date(now.getTime() + i * 60 * 60 * 1000)
    const hourOfDay = hour.getHours()
    
    // Temperature varies by time of day (cooler at night, warmer in afternoon)
    let tempVariation = 0
    if (hourOfDay >= 6 && hourOfDay < 12) {
      tempVariation = (hourOfDay - 6) * 1.5 // Morning warming
    } else if (hourOfDay >= 12 && hourOfDay < 16) {
      tempVariation = 9 + Math.random() * 2 // Afternoon peak
    } else if (hourOfDay >= 16 && hourOfDay < 20) {
      tempVariation = 9 - (hourOfDay - 16) * 1.5 // Evening cooling
    } else {
      tempVariation = -(20 - hourOfDay) * 0.5 // Night time
    }
    
    const temp = Math.round(currentTemp + tempVariation + (Math.random() * 2 - 1))
    
    // Rain probability varies randomly but with some continuity
    let rainProb = 0
    if (i === 0) {
      rainProb = currentRainProbability
    } else {
      // Base on previous hour with some variation
      const prevRain = hourly[i - 1].rainProbability
      rainProb = Math.max(0, Math.min(100, prevRain + Math.floor(Math.random() * 20 - 10)))
    }
    
    hourly.push({
      time: hourOfDay,
      displayTime: `${String(hourOfDay).padStart(2, '0')}:00`,
      temperature: temp,
      rainProbability: rainProb
    })
  }
  
  return {
    city,
    current: {
      temperature: currentTemp,
      condition: currentCondition.condition,
      icon: currentCondition.icon,
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      high: currentHigh,
      low: currentLow,
      wind: windLevels[Math.floor(Math.random() * windLevels.length)],
      rainProbability: currentRainProbability
    },
    hourly,
    forecast
  }
}

