import { useState } from 'react'
import './Calculator.css'

const Calculator = () => {
  const [mode, setMode] = useState('scientific') // 'scientific' or 'programmer'
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState(null)
  const [operation, setOperation] = useState(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  
  // Scientific calculator states
  const [angleUnit, setAngleUnit] = useState('DEG') // 'DEG' or 'RAD'
  const [memory, setMemory] = useState(0)
  const [hasMemory, setHasMemory] = useState(false)
  const [isSecondFn, setIsSecondFn] = useState(false) // For 2nd function toggle
  
  // Programmer calculator states
  const [base, setBase] = useState('DEC') // 'HEX', 'DEC', 'OCT', 'BIN'
  const [decValue, setDecValue] = useState(0)

  const isDigitAllowed = (digit) => {
    if (mode !== 'programmer') return true
    
    switch (base) {
      case 'BIN':
        return digit <= 1
      case 'OCT':
        return digit <= 7
      case 'DEC':
        return digit <= 9
      case 'HEX':
        return digit <= 9
      default:
        return true
    }
  }

  const inputDigit = (digit) => {
    // Check if digit is allowed in current base
    if (mode === 'programmer' && !isDigitAllowed(digit)) {
      return
    }

    if (waitingForOperand) {
      setDisplay(String(digit))
      setWaitingForOperand(false)
    } else {
      const cleanDisplay = display.replace(/\s/g, '')
      const newDisplay = cleanDisplay === '0' ? String(digit) : cleanDisplay + digit
      // Apply formatting for programmer mode
      if (mode === 'programmer') {
        const num = parseInt(newDisplay, getBaseRadix(base))
        setDisplay(convertToDecBase(num, base))
      } else {
        setDisplay(newDisplay)
      }
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
    setDecValue(0)
  }

  const backspace = () => {
    if (display.length === 1 || (display.length === 2 && display[0] === '-')) {
      setDisplay('0')
    } else {
      setDisplay(display.slice(0, -1))
    }
  }

  const toggleSign = () => {
    const value = parseFloat(display)
    setDisplay(String(-value))
  }

  // Scientific calculator functions
  const toRadians = (deg) => deg * (Math.PI / 180)
  const toDegrees = (rad) => rad * (180 / Math.PI)

  const performScientificOperation = (op) => {
    const value = parseFloat(display)
    let result

    switch (op) {
      // Trigonometric functions
      case 'sin':
        result = angleUnit === 'DEG' ? Math.sin(toRadians(value)) : Math.sin(value)
        break
      case 'cos':
        result = angleUnit === 'DEG' ? Math.cos(toRadians(value)) : Math.cos(value)
        break
      case 'tan':
        result = angleUnit === 'DEG' ? Math.tan(toRadians(value)) : Math.tan(value)
        break
      case 'asin':
        result = angleUnit === 'DEG' ? toDegrees(Math.asin(value)) : Math.asin(value)
        break
      case 'acos':
        result = angleUnit === 'DEG' ? toDegrees(Math.acos(value)) : Math.acos(value)
        break
      case 'atan':
        result = angleUnit === 'DEG' ? toDegrees(Math.atan(value)) : Math.atan(value)
        break
      // Power and root
      case 'x²':
        result = value * value
        break
      case 'x³':
        result = value * value * value
        break
      case '√':
        result = Math.sqrt(value)
        break
      case '³√':
        result = Math.cbrt(value)
        break
      case '1/x':
        result = 1 / value
        break
      case '|x|':
        result = Math.abs(value)
        break
      // Exponential and logarithmic
      case 'exp':
        result = Math.exp(value)
        break
      case 'ln':
        result = Math.log(value)
        break
      case 'log':
        result = Math.log10(value)
        break
      case '10^x':
        result = Math.pow(10, value)
        break
      case 'e^x':
        result = Math.exp(value)
        break
      case '2^x':
        result = Math.pow(2, value)
        break
      // Factorial
      case 'n!':
        result = factorial(Math.floor(value))
        break
      default:
        result = value
    }

    if (!isFinite(result)) {
      setDisplay('Error')
    } else {
      setDisplay(formatResult(result))
    }
    setWaitingForOperand(true)
  }

  const factorial = (n) => {
    if (n < 0) return NaN
    if (n === 0 || n === 1) return 1
    let result = 1
    for (let i = 2; i <= n; i++) {
      result *= i
    }
    return result
  }

  const formatResult = (num) => {
    if (Math.abs(num) < 1e-10 && num !== 0) {
      return num.toExponential(6)
    }
    if (Math.abs(num) >= 1e10) {
      return num.toExponential(6)
    }
    // Round to avoid floating point errors
    const rounded = Math.round(num * 1e10) / 1e10
    return String(rounded)
  }

  const inputConstant = (constant) => {
    let value
    switch (constant) {
      case 'π':
        value = Math.PI
        break
      case 'e':
        value = Math.E
        break
      default:
        return
    }
    setDisplay(formatResult(value))
    setWaitingForOperand(true)
  }

  // Memory functions
  const memoryClear = () => {
    setMemory(0)
    setHasMemory(false)
  }

  const memoryRecall = () => {
    setDisplay(formatResult(memory))
    setWaitingForOperand(true)
  }

  const memoryAdd = () => {
    setMemory(memory + parseFloat(display))
    setHasMemory(true)
    setWaitingForOperand(true)
  }

  const memorySubtract = () => {
    setMemory(memory - parseFloat(display))
    setHasMemory(true)
    setWaitingForOperand(true)
  }

  const memoryStore = () => {
    setMemory(parseFloat(display))
    setHasMemory(true)
    setWaitingForOperand(true)
  }

  const performOperation = (nextOperation) => {
    if (mode === 'programmer') {
      // In programmer mode, handle bitwise operations
      if (['AND', 'OR', 'XOR', '<<', '>>'].includes(nextOperation)) {
        handleBitwiseOperation(nextOperation)
        return
      }
      
      // Handle equals for bitwise operations
      if (nextOperation === '=' && operation && ['AND', 'OR', 'XOR', '<<', '>>'].includes(operation)) {
        const currentValue = parseInt(display.replace(/\s/g, ''), getBaseRadix(base))
        let result = currentValue
        
        if (previousValue !== null) {
          switch (operation) {
            case 'AND':
              result = previousValue & currentValue
              break
            case 'OR':
              result = previousValue | currentValue
              break
            case 'XOR':
              result = previousValue ^ currentValue
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
          const resultStr = convertToDecBase(result, base)
          setDisplay(resultStr)
          setDecValue(result)
          setPreviousValue(null) // Clear after equals
          setOperation(null)
          setWaitingForOperand(false)
        }
        return
      }
    }

    const inputValue = parseFloat(display.replace(/\s/g, ''))

    if (previousValue === null) {
      setPreviousValue(inputValue)
    } else if (operation) {
      const currentValue = previousValue || 0
      const newValue = calculate(currentValue, inputValue, operation)
      
      if (mode === 'programmer') {
        const resultStr = convertToDecBase(Math.floor(newValue), base)
        setDisplay(resultStr)
        setDecValue(Math.floor(newValue))
      } else {
        setDisplay(String(newValue))
      }
      setPreviousValue(newValue)
    }

    if (nextOperation !== '=') {
      setWaitingForOperand(true)
      setOperation(nextOperation)
    } else {
      setWaitingForOperand(false)
      setOperation(null)
    }
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
      case 'xʸ':
        return Math.pow(prev, current)
      case 'ʸ√x':
        return Math.pow(prev, 1 / current)
      case 'mod':
        return prev % current
      default:
        return current
    }
  }

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
    // Remove spaces from value before parsing
    const cleanValue = String(value).replace(/\s/g, '')
    const num = parseInt(cleanValue, getBaseRadix(base))
    if (isNaN(num)) return '0'
    
    // Handle negative numbers as unsigned 64-bit integers for non-DEC bases
    let displayNum = num
    if (num < 0 && targetBase !== 'DEC') {
      // Convert to unsigned 64-bit integer
      displayNum = (num >>> 0) // 32-bit unsigned
    }
    
    let result
    switch (targetBase) {
      case 'HEX':
        result = displayNum.toString(16).toUpperCase()
        return formatWithSpaces(result, 4)
      case 'DEC':
        return num.toString(10)
      case 'OCT':
        result = displayNum.toString(8)
        return formatWithSpaces(result, 3)
      case 'BIN':
        result = displayNum.toString(2)
        return formatWithSpaces(result, 4)
      default:
        return num.toString(10)
    }
  }

  // Format number with spaces for readability
  const formatWithSpaces = (str, groupSize) => {
    // Reverse the string, add spaces, then reverse back
    const reversed = str.split('').reverse().join('')
    const groups = []
    for (let i = 0; i < reversed.length; i += groupSize) {
      groups.push(reversed.slice(i, i + groupSize))
    }
    return groups.join(' ').split('').reverse().join('')
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
    const currentValue = parseInt(display.replace(/\s/g, ''), getBaseRadix(base))
    const newDisplay = convertToDecBase(currentValue, newBase)
    setBase(newBase)
    setDisplay(newDisplay)
    setDecValue(currentValue)
  }

  const handleBitwiseOperation = (op) => {
    const currentValue = parseInt(display.replace(/\s/g, ''), getBaseRadix(base))
    let result = currentValue

    if (op === 'NOT') {
      // NOT is a unary operation
      result = ~currentValue
      const resultStr = convertToDecBase(result, base)
      setDisplay(resultStr)
      setPreviousValue(result)
      setOperation(null)
      setWaitingForOperand(false)
      setDecValue(result)
    } else if (previousValue !== null && operation) {
      // Execute pending operation
      switch (operation) {
        case 'AND':
          result = previousValue & currentValue
          break
        case 'OR':
          result = previousValue | currentValue
          break
        case 'XOR':
          result = previousValue ^ currentValue
          break
        case '<<':
          result = previousValue << currentValue
          break
        case '>>':
          result = previousValue >> currentValue
          break
        default:
          result = currentValue
          break
      }
      const resultStr = convertToDecBase(result, base)
      setDisplay(resultStr)
      setPreviousValue(result)
      setOperation(op) // Set new operation
      setWaitingForOperand(true)
      setDecValue(result)
    } else {
      // First operand, set operation
      setPreviousValue(currentValue)
      setOperation(op)
      setWaitingForOperand(true)
      setDecValue(currentValue)
    }
  }

  // Convert a decimal number to target base
  const convertToDecBase = (decNum, targetBase) => {
    // Handle negative numbers as unsigned for non-DEC bases
    let displayNum = decNum
    if (decNum < 0 && targetBase !== 'DEC') {
      displayNum = (decNum >>> 0) // 32-bit unsigned
    }
    
    let result
    switch (targetBase) {
      case 'HEX':
        result = displayNum.toString(16).toUpperCase()
        return formatWithSpaces(result, 4)
      case 'DEC':
        return decNum.toString(10)
      case 'OCT':
        result = displayNum.toString(8)
        return formatWithSpaces(result, 3)
      case 'BIN':
        result = displayNum.toString(2)
        return formatWithSpaces(result, 4)
      default:
        return decNum.toString(10)
    }
  }

  const inputHexDigit = (digit) => {
    if (base !== 'HEX') return
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      const cleanDisplay = display.replace(/\s/g, '')
      const newDisplay = cleanDisplay === '0' ? digit : cleanDisplay + digit
      const num = parseInt(newDisplay, 16)
      setDisplay(convertToDecBase(num, 'HEX'))
    }
  }

  const renderScientificCalculator = () => (
    <div className="calc-container scientific">
      {/* Display */}
      <div className="calc-display scientific-display">{display}</div>
      
      {/* Horizontal layout: Left (functions) | Right (number pad) */}
      <div className="sci-horizontal-layout">
        {/* Left panel: Scientific functions */}
        <div className="sci-left-panel">
          {/* Mode and Memory row */}
          <div className="sci-top-row">
            <button 
              className={`sci-mode-btn ${angleUnit === 'DEG' ? 'active' : ''}`}
              onClick={() => setAngleUnit('DEG')}
            >
              DEG
            </button>
            <button 
              className={`sci-mode-btn ${angleUnit === 'RAD' ? 'active' : ''}`}
              onClick={() => setAngleUnit('RAD')}
            >
              RAD
            </button>
            <button 
              className={`sci-fn-btn toggle ${isSecondFn ? 'active' : ''}`} 
              onClick={() => setIsSecondFn(!isSecondFn)}
            >
              2nd
            </button>
          </div>

          {/* Scientific functions grid */}
          <div className="sci-functions-grid">
            {/* Row 1 */}
            <button className="sci-fn-btn" onClick={() => performScientificOperation(isSecondFn ? 'asin' : 'sin')}>
              {isSecondFn ? 'sin⁻¹' : 'sin'}
            </button>
            <button className="sci-fn-btn" onClick={() => performScientificOperation(isSecondFn ? 'acos' : 'cos')}>
              {isSecondFn ? 'cos⁻¹' : 'cos'}
            </button>
            <button className="sci-fn-btn" onClick={() => performScientificOperation(isSecondFn ? 'atan' : 'tan')}>
              {isSecondFn ? 'tan⁻¹' : 'tan'}
            </button>
            
            {/* Row 2 */}
            <button className="sci-fn-btn" onClick={() => performScientificOperation(isSecondFn ? 'x³' : 'x²')}>
              {isSecondFn ? 'x³' : 'x²'}
            </button>
            <button className="sci-fn-btn" onClick={() => performScientificOperation(isSecondFn ? '³√' : '√')}>
              {isSecondFn ? '³√x' : '√x'}
            </button>
            <button className="sci-fn-btn" onClick={() => performOperation(isSecondFn ? 'ʸ√x' : 'xʸ')}>
              {isSecondFn ? 'ʸ√x' : 'xʸ'}
            </button>
            
            {/* Row 3 */}
            <button className="sci-fn-btn" onClick={() => performScientificOperation(isSecondFn ? 'e^x' : 'log')}>
              {isSecondFn ? 'eˣ' : 'log'}
            </button>
            <button className="sci-fn-btn" onClick={() => performScientificOperation('ln')}>ln</button>
            <button className="sci-fn-btn" onClick={() => performScientificOperation(isSecondFn ? '2^x' : '10^x')}>
              {isSecondFn ? '2ˣ' : '10ˣ'}
            </button>
            
            {/* Row 4 */}
            <button className="sci-fn-btn" onClick={() => performScientificOperation('1/x')}>1/x</button>
            <button className="sci-fn-btn" onClick={() => performScientificOperation('|x|')}>|x|</button>
            <button className="sci-fn-btn" onClick={() => performScientificOperation('n!')}>n!</button>
            
            {/* Row 5: Constants */}
            <button className="sci-fn-btn const" onClick={() => inputConstant('π')}>π</button>
            <button className="sci-fn-btn const" onClick={() => inputConstant('e')}>e</button>
            <button className="sci-fn-btn" onClick={() => performScientificOperation('exp')}>exp</button>
          </div>

          {/* Memory row */}
          <div className="sci-memory-row">
            <button className={`sci-mem-btn ${!hasMemory ? 'disabled' : ''}`} onClick={memoryClear} disabled={!hasMemory}>MC</button>
            <button className={`sci-mem-btn ${!hasMemory ? 'disabled' : ''}`} onClick={memoryRecall} disabled={!hasMemory}>MR</button>
            <button className="sci-mem-btn" onClick={memoryAdd}>M+</button>
            <button className="sci-mem-btn" onClick={memorySubtract}>M−</button>
            <button className="sci-mem-btn" onClick={memoryStore}>MS</button>
          </div>
        </div>

        {/* Right panel: Number pad and basic operators */}
        <div className="sci-right-panel">
          <div className="sci-numpad">
            {/* Row 1 */}
            <button className="sci-num-btn func" onClick={clear}>C</button>
            <button className="sci-num-btn func" onClick={backspace}>⌫</button>
            <button className="sci-num-btn operator" onClick={() => performOperation('mod')}>mod</button>
            <button className="sci-num-btn operator" onClick={() => performOperation('÷')}>÷</button>
            
            {/* Row 2 */}
            <button className="sci-num-btn digit" onClick={() => inputDigit(7)}>7</button>
            <button className="sci-num-btn digit" onClick={() => inputDigit(8)}>8</button>
            <button className="sci-num-btn digit" onClick={() => inputDigit(9)}>9</button>
            <button className="sci-num-btn operator" onClick={() => performOperation('×')}>×</button>
            
            {/* Row 3 */}
            <button className="sci-num-btn digit" onClick={() => inputDigit(4)}>4</button>
            <button className="sci-num-btn digit" onClick={() => inputDigit(5)}>5</button>
            <button className="sci-num-btn digit" onClick={() => inputDigit(6)}>6</button>
            <button className="sci-num-btn operator" onClick={() => performOperation('-')}>−</button>
            
            {/* Row 4 */}
            <button className="sci-num-btn digit" onClick={() => inputDigit(1)}>1</button>
            <button className="sci-num-btn digit" onClick={() => inputDigit(2)}>2</button>
            <button className="sci-num-btn digit" onClick={() => inputDigit(3)}>3</button>
            <button className="sci-num-btn operator" onClick={() => performOperation('+')}>+</button>
            
            {/* Row 5 */}
            <button className="sci-num-btn digit" onClick={toggleSign}>+/−</button>
            <button className="sci-num-btn digit" onClick={() => inputDigit(0)}>0</button>
            <button className="sci-num-btn digit" onClick={inputDecimal}>.</button>
            <button className="sci-num-btn equals" onClick={() => performOperation('=')}>=</button>
          </div>
        </div>
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
          
          <button 
            className={`prog-btn ${!isDigitAllowed(7) ? 'disabled' : ''}`}
            onClick={() => inputDigit(7)}
            disabled={!isDigitAllowed(7)}
          >7</button>
          <button 
            className={`prog-btn ${!isDigitAllowed(8) ? 'disabled' : ''}`}
            onClick={() => inputDigit(8)}
            disabled={!isDigitAllowed(8)}
          >8</button>
          <button 
            className={`prog-btn ${!isDigitAllowed(9) ? 'disabled' : ''}`}
            onClick={() => inputDigit(9)}
            disabled={!isDigitAllowed(9)}
          >9</button>
          <button className="prog-btn operator" onClick={() => performOperation('+')}>+</button>
          
          <button 
            className={`prog-btn ${!isDigitAllowed(4) ? 'disabled' : ''}`}
            onClick={() => inputDigit(4)}
            disabled={!isDigitAllowed(4)}
          >4</button>
          <button 
            className={`prog-btn ${!isDigitAllowed(5) ? 'disabled' : ''}`}
            onClick={() => inputDigit(5)}
            disabled={!isDigitAllowed(5)}
          >5</button>
          <button 
            className={`prog-btn ${!isDigitAllowed(6) ? 'disabled' : ''}`}
            onClick={() => inputDigit(6)}
            disabled={!isDigitAllowed(6)}
          >6</button>
          <button className="prog-btn equals" onClick={() => performOperation('=')} style={{gridRow: 'span 2'}}>
            =
          </button>
          
          <button 
            className={`prog-btn ${!isDigitAllowed(1) ? 'disabled' : ''}`}
            onClick={() => inputDigit(1)}
            disabled={!isDigitAllowed(1)}
          >1</button>
          <button 
            className={`prog-btn ${!isDigitAllowed(2) ? 'disabled' : ''}`}
            onClick={() => inputDigit(2)}
            disabled={!isDigitAllowed(2)}
          >2</button>
          <button 
            className={`prog-btn ${!isDigitAllowed(3) ? 'disabled' : ''}`}
            onClick={() => inputDigit(3)}
            disabled={!isDigitAllowed(3)}
          >3</button>
          
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
          className={`mode-btn ${mode === 'scientific' ? 'active' : ''}`}
          onClick={() => setMode('scientific')}
        >
          🔬 科学
        </button>
        <button 
          className={`mode-btn ${mode === 'programmer' ? 'active' : ''}`}
          onClick={() => setMode('programmer')}
        >
          💻 程序员
        </button>
      </div>

      {mode === 'scientific' ? renderScientificCalculator() : renderProgrammerCalculator()}
    </div>
  )
}

export default Calculator

