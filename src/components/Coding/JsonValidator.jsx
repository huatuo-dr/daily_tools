import { useState } from 'react'
import './JsonValidator.css'

const JsonValidator = () => {
  const [input, setInput] = useState('')
  const [formatted, setFormatted] = useState('')
  const [status, setStatus] = useState(null) // 'valid', 'error', null
  const [errorMessage, setErrorMessage] = useState('')

  const validateAndFormat = (jsonString) => {
    if (!jsonString.trim()) {
      setStatus(null)
      setFormatted('')
      setErrorMessage('')
      return
    }

    try {
      const parsed = JSON.parse(jsonString)
      const formatted = JSON.stringify(parsed, null, 2)
      setFormatted(formatted)
      setStatus('valid')
      setErrorMessage('')
    } catch (error) {
      setStatus('error')
      setFormatted('')
      setErrorMessage(error.message)
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setInput(value)
    validateAndFormat(value)
  }

  const handleFormat = () => {
    validateAndFormat(input)
  }

  const handleMinify = () => {
    if (!input.trim()) {
      setErrorMessage('请先输入JSON')
      return
    }

    try {
      const parsed = JSON.parse(input)
      const minified = JSON.stringify(parsed)
      setFormatted(minified)
      setStatus('valid')
      setErrorMessage('')
    } catch (error) {
      setStatus('error')
      setFormatted('')
      setErrorMessage(error.message)
    }
  }

  const handleCopy = () => {
    if (formatted) {
      navigator.clipboard.writeText(formatted)
      const btn = document.querySelector('.json-copy-btn')
      const originalText = btn.textContent
      btn.textContent = '✓ 已复制'
      setTimeout(() => {
        btn.textContent = originalText
      }, 1500)
    }
  }

  const handleClear = () => {
    setInput('')
    setFormatted('')
    setStatus(null)
    setErrorMessage('')
  }

  const sampleJson = {
    name: "示例JSON",
    version: "1.0.0",
    data: {
      users: [
        { id: 1, name: "张三", age: 25 },
        { id: 2, name: "李四", age: 30 }
      ],
      active: true
    }
  }

  const loadSample = () => {
    const sample = JSON.stringify(sampleJson, null, 2)
    setInput(sample)
    validateAndFormat(sample)
  }

  return (
    <div className="json-validator">
      <div className="json-layout">
        <div className="json-section">
          <div className="json-header">
            <h3 className="json-title">JSON输入</h3>
            <div className="json-actions">
              <button onClick={loadSample} className="json-btn sample-btn">
                📝 示例
              </button>
              <button onClick={handleFormat} className="json-btn format-btn">
                ✨ 格式化
              </button>
              <button onClick={handleMinify} className="json-btn minify-btn">
                🗜️ 压缩
              </button>
              <button onClick={handleClear} className="json-btn clear-btn">
                🗑️ 清空
              </button>
            </div>
          </div>
          <textarea
            className="json-input"
            value={input}
            onChange={handleInputChange}
            placeholder='请输入JSON数据，例如：{"name": "示例", "value": 123}'
          />
        </div>

        <div className="json-section">
          <div className="json-header">
            <h3 className="json-title">
              {status === 'valid' && <span className="status-icon valid">✓</span>}
              {status === 'error' && <span className="status-icon error">✗</span>}
              输出结果
            </h3>
            {status === 'valid' && (
              <button onClick={handleCopy} className="json-btn json-copy-btn">
                📋 复制
              </button>
            )}
          </div>
          
          {status === 'valid' && (
            <textarea
              className="json-output valid"
              value={formatted}
              readOnly
            />
          )}
          
          {status === 'error' && (
            <div className="json-error">
              <div className="error-icon-large">⚠️</div>
              <div className="error-title">JSON格式错误</div>
              <div className="error-details">{errorMessage}</div>
            </div>
          )}
          
          {status === null && (
            <div className="json-placeholder">
              <div className="placeholder-icon">{ }</div>
              <div className="placeholder-text">输入JSON后将显示校验结果</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JsonValidator

