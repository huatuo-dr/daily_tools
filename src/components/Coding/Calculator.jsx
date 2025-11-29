import { useState } from 'react'
import './Calculator.css'

const Calculator = () => {
  const [mode, setMode] = useState('standard') // 'standard' or 'programmer'
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState(null)
  const [operation, setOperation] = useState(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  
  // Programmer calculator states
  const [base, setBase] = useState('DEC') // 'HEX', 'DEC', 'OCT', 'BIN'
  const [decValue, setDecValue] = useState(0)

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(String(digit))
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit)
    }
  }

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.')
    }
  }

  const clear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
    setWaitingForOperand(false)
  }

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display)

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)
      
      setDisplay(String(newValue))
      setPreviousValue(newValue)
    }

    setWaitingForOperand(true)
    setOperation(nextOperation)
  }

  const calculate = (prev, current, op) => {
    switch (op) {
      case '+':
        return prev + current
      case '-':
        return prev - current
      case '×':
        return prev * current
      case '÷':
        return current !== 0 ? prev / current : 0
      default:
        return current
    }
  }

  const buttons = [
    { value: 'C', type: 'function', span: 2 },
    { value: '÷', type: 'operator' },
    { value: '×', type: 'operator' },
    { value: '7', type: 'digit' },
    { value: '8', type: 'digit' },
    { value: '9', type: 'digit' },
    { value: '-', type: 'operator' },
    { value: '4', type: 'digit' },
    { value: '5', type: 'digit' },
    { value: '6', type: 'digit' },
    { value: '+', type: 'operator' },
    { value: '1', type: 'digit' },
    { value: '2', type: 'digit' },
    { value: '3', type: 'digit' },
    { value: '=', type: 'equals' },
    { value: '0', type: 'digit', span: 2 },
    { value: '.', type: 'digit' },
  ]

  const handleButtonClick = (button) => {
    if (button.type === 'digit') {
      if (button.value === '.') {
        inputDecimal()
      } else {
        inputDigit(parseInt(button.value))
      }
    } else if (button.type === 'operator') {
      performOperation(button.value)
    } else if (button.type === 'equals') {
      performOperation('=')
    } else if (button.type === 'function' && button.value === 'C') {
      clear()
    }
  }

  // Programmer calculator functions
  const convertToBase = (value, targetBase) => {
    const num = parseInt(value, getBaseRadix(base))
    if (isNaN(num)) return '0'
    
    switch (targetBase) {
      case 'HEX':
        return num.toString(16).toUpperCase()
      case 'DEC':
        return num.toString(10)
      case 'OCT':
        return num.toString(8)
      case 'BIN':
        return num.toString(2)
      default:
        return num.toString(10)
    }
  }

  const getBaseRadix = (baseType) => {
    switch (baseType) {
      case 'HEX': return 16
      case 'DEC': return 10
      case 'OCT': return 8
      case 'BIN': return 2
      default: return 10
    }
  }

  const handleBaseChange = (newBase) => {
    const currentValue = parseInt(display, getBaseRadix(base))
    setBase(newBase)
    setDisplay(convertToBase(display, newBase))
    setDecValue(currentValue)
  }

  const handleBitwiseOperation = (op) => {
    const currentValue = parseInt(display, getBaseRadix(base))
    let result = currentValue

    if (previousValue !== null) {
      switch (op) {
        case 'AND':
          result = previousValue & currentValue
          break
        case 'OR':
          result = previousValue | currentValue
          break
        case 'XOR':
          result = previousValue ^ currentValue
          break
        case 'NOT':
          result = ~currentValue
          break
        case '<<':
          result = previousValue << currentValue
          break
        case '>>':
          result = previousValue >> currentValue
          break
        default:
          break
      }
      setDisplay(convertToBase(result.toString(), base))
      setPreviousValue(null)
      setOperation(null)
    } else if (op === 'NOT') {
      result = ~currentValue
      setDisplay(convertToBase(result.toString(), base))
    } else {
      setPreviousValue(currentValue)
      setOperation(op)
      setWaitingForOperand(true)
    }
    setDecValue(result)
  }

  const inputHexDigit = (digit) => {
    if (base !== 'HEX') return
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }

  const renderStandardCalculator = () => (
    <div className="calc-container">
      <div className="calc-display">{display}</div>
      <div className="calc-buttons">
        {buttons.map((button, index) => (
          <button
            key={index}
            className={`calc-btn ${button.type} ${button.span ? `span-${button.span}` : ''}`}
            onClick={() => handleButtonClick(button)}
          >
            {button.value}
          </button>
        ))}
      </div>
    </div>
  )

  const renderProgrammerCalculator = () => (
    <div className="calc-container programmer">
      {/* Main display */}
      <div className="calc-display programmer-display">{display}</div>

      {/* Two column layout: Base displays | Buttons */}
      <div className="programmer-layout">
        {/* Base conversion display */}
        <div className="base-displays">
          {['HEX', 'DEC', 'OCT', 'BIN'].map(b => (
            <div key={b} className={`base-row ${base === b ? 'active' : ''}`}>
              <button 
                className="base-label"
                onClick={() => handleBaseChange(b)}
              >
                {b}
              </button>
              <div className="base-value">
                {convertToBase(display, b)}
              </div>
            </div>
          ))}
        </div>

        {/* Programmer buttons */}
        <div className="programmer-buttons">
        {/* Bitwise operations */}
        <div className="bitwise-ops">
          <button className="prog-btn bitwise" onClick={() => handleBitwiseOperation('AND')}>AND</button>
          <button className="prog-btn bitwise" onClick={() => handleBitwiseOperation('OR')}>OR</button>
          <button className="prog-btn bitwise" onClick={() => handleBitwiseOperation('XOR')}>XOR</button>
          <button className="prog-btn bitwise" onClick={() => handleBitwiseOperation('NOT')}>NOT</button>
          <button className="prog-btn bitwise" onClick={() => handleBitwiseOperation('<<')}>&lt;&lt;</button>
          <button className="prog-btn bitwise" onClick={() => handleBitwiseOperation('>>')}>&gt;&gt;</button>
        </div>

        {/* Hex digits (A-F) */}
        <div className="hex-row">
          {['A', 'B', 'C', 'D', 'E', 'F'].map(digit => (
            <button
              key={digit}
              className={`prog-btn hex ${base !== 'HEX' ? 'disabled' : ''}`}
              onClick={() => inputHexDigit(digit)}
              disabled={base !== 'HEX'}
            >
              {digit}
            </button>
          ))}
        </div>

        {/* Number pad */}
        <div className="number-pad">
          <button className="prog-btn function" onClick={clear}>C</button>
          <button className="prog-btn operator" onClick={() => performOperation('÷')}>÷</button>
          <button className="prog-btn operator" onClick={() => performOperation('×')}>×</button>
          <button className="prog-btn operator" onClick={() => performOperation('-')}>-</button>
          
          <button className="prog-btn" onClick={() => inputDigit(7)}>7</button>
          <button className="prog-btn" onClick={() => inputDigit(8)}>8</button>
          <button className="prog-btn" onClick={() => inputDigit(9)}>9</button>
          <button className="prog-btn operator" onClick={() => performOperation('+')}>+</button>
          
          <button className="prog-btn" onClick={() => inputDigit(4)}>4</button>
          <button className="prog-btn" onClick={() => inputDigit(5)}>5</button>
          <button className="prog-btn" onClick={() => inputDigit(6)}>6</button>
          <button className="prog-btn equals" onClick={() => performOperation('=')} style={{gridRow: 'span 2'}}>
            =
          </button>
          
          <button className="prog-btn" onClick={() => inputDigit(1)}>1</button>
          <button className="prog-btn" onClick={() => inputDigit(2)}>2</button>
          <button className="prog-btn" onClick={() => inputDigit(3)}>3</button>
          
          <button className="prog-btn" onClick={() => inputDigit(0)} style={{gridColumn: 'span 2'}}>0</button>
          <button className="prog-btn" onClick={inputDecimal}>.</button>
        </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="calculator">
      {/* Mode switcher */}
      <div className="calc-mode-switcher">
        <button 
          className={`mode-btn ${mode === 'standard' ? 'active' : ''}`}
          onClick={() => setMode('standard')}
        >
          🔢 标准
        </button>
        <button 
          className={`mode-btn ${mode === 'programmer' ? 'active' : ''}`}
          onClick={() => setMode('programmer')}
        >
          💻 程序员
        </button>
      </div>

      {mode === 'standard' ? renderStandardCalculator() : renderProgrammerCalculator()}
    </div>
  )
}

export default Calculator

