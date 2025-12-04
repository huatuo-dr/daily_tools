import { useState, useRef, useEffect, useCallback } from 'react'
import './Moyu.css'
import { Game24 } from './games/Game24'
import { GuessNumber } from './games/GuessNumber'
import { TypingTest } from './games/TypingTest'
import { NumberPuzzle } from './games/NumberPuzzle'
import { MathQuiz } from './games/MathQuiz'

// Game registry
const GAMES = [
  { id: 1, name: 'Point24', command: '24', description: 'Use 4 numbers to make 24 with +,-,*,/', GameClass: Game24 },
  { id: 2, name: 'GuessNum', command: 'guess', description: 'Guess 4-digit number, get XAYB feedback', GameClass: GuessNumber },
  { id: 3, name: 'Typing', command: 'type', description: 'Test your typing speed and accuracy', GameClass: TypingTest },
  { id: 4, name: 'NumPuzzle', command: 'puzzle', description: 'Find the pattern, guess next number', GameClass: NumberPuzzle },
  { id: 5, name: 'MathQuiz', command: 'math', description: 'Quick arithmetic challenges', GameClass: MathQuiz }
]

const Moyu = () => {
  const [lines, setLines] = useState([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [currentGame, setCurrentGame] = useState(null)
  const [gameInstance, setGameInstance] = useState(null)
  
  const inputRef = useRef(null)
  const terminalRef = useRef(null)
  const terminalBodyRef = useRef(null)

  // Print lines to terminal
  const print = useCallback((content, type = 'output') => {
    const newLines = Array.isArray(content) ? content : [content]
    setLines(prev => [...prev, ...newLines.map(text => ({ text, type }))])
  }, [])

  // Print welcome message on mount (use ref to prevent double-call in StrictMode)
  const welcomePrinted = useRef(false)
  useEffect(() => {
    if (welcomePrinted.current) return
    welcomePrinted.current = true
    
    const welcome = [
      '┌────────────────────────────────────────────────┐',
      '│              🐟 MOYU TERMINAL                  │',
      '│         Pretend to work, play games           │',
      '└────────────────────────────────────────────────┘',
      '',
      'Welcome to MOYU Terminal! Look busy while having fun...',
      '',
      'Type "help" for commands, "games" for available games',
      ''
    ]
    print(welcome, 'system')
  }, [print])

  // Auto scroll to bottom
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight
    }
  }, [lines])

  // Focus input on click (only if no text is selected)
  const handleTerminalClick = (e) => {
    // Don't focus if user is selecting text
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      return
    }
    // Only focus if clicking on empty area or input line
    if (e.target.closest('.terminal-line')) {
      return
    }
    inputRef.current?.focus()
  }

  // Show help info
  const showHelp = () => {
    if (currentGame) {
      // In-game help
      const gameHelp = gameInstance?.getHelp?.() || ['No help available']
      print(['', '📖 Game Help:', ...gameHelp, '', 'Type "exit" to quit game', ''], 'help')
    } else {
      // Main menu help
      print([
        '',
        '📖 Available Commands:',
        '  help     - Show this help message',
        '  games    - List available games',
        '  start N  - Start game with ID N',
        '  clear    - Clear screen',
        ''
      ], 'help')
    }
  }

  // Show games list
  const showGames = () => {
    print([
      '',
      '🎮 Available Games:',
      ...GAMES.map(g => `  [${g.id}] ${g.name} - ${g.description}`),
      '',
      'Use "start N" to launch a game, e.g. start 1',
      ''
    ], 'info')
  }

  // Start a game
  const startGame = (num) => {
    const gameId = parseInt(num, 10)
    const game = GAMES.find(g => g.id === gameId)
    
    if (!game) {
      print([`❌ Game #${num} not found. Use "games" to see available games`], 'error')
      return
    }

    setCurrentGame(game)
    const instance = new game.GameClass()
    setGameInstance(instance)
    
    print([
      '',
      `🎮 Starting ${game.name}...`,
      '═'.repeat(50),
      ''
    ], 'system')
    
    // Get initial game output
    const initOutput = instance.init()
    if (initOutput) {
      print(Array.isArray(initOutput) ? initOutput : [initOutput], 'game')
    }
  }

  // Exit current game
  const exitGame = () => {
    print([
      '',
      `👋 Exited ${currentGame.name}`,
      '',
      'Type "games" for other games, or "help" for commands',
      ''
    ], 'system')
    setCurrentGame(null)
    setGameInstance(null)
  }

  // Process command
  const processCommand = (cmd) => {
    const trimmed = cmd.trim()
    if (!trimmed) return

    // Add to history
    setHistory(prev => [...prev.filter(h => h !== trimmed), trimmed])
    setHistoryIndex(-1)

    // Print user input
    print(`$ ${trimmed}`, 'input')

    // In-game mode
    if (currentGame && gameInstance) {
      if (trimmed.toLowerCase() === 'exit') {
        exitGame()
        return
      }
      if (trimmed.toLowerCase() === 'help') {
        showHelp()
        return
      }
      // Pass to game
      const output = gameInstance.processInput(trimmed)
      if (output) {
        print(Array.isArray(output) ? output : [output], 'game')
      }
      return
    }

    // Main menu commands
    const parts = trimmed.toLowerCase().split(/\s+/)
    const command = parts[0]

    switch (command) {
      case 'help':
        showHelp()
        break
      case 'games':
        showGames()
        break
      case 'start':
        if (parts[1]) {
          startGame(parts[1])
        } else {
          print(['❌ Please specify game ID, e.g. start 1'], 'error')
        }
        break
      case 'clear':
        setLines([])
        break
      default:
        print([`❌ Unknown command: ${command}`, 'Type "help" for available commands'], 'error')
    }
  }

  // Get current input value (works with both controlled and direct input)
  const getCurrentInput = () => {
    return inputRef.current?.value || ''
  }

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault()
    const cmd = getCurrentInput()
    processCommand(cmd)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    setInput('')
  }

  // Handle key events for history navigation and enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = getCurrentInput()
      processCommand(cmd)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        const histCmd = history[history.length - 1 - newIndex] || ''
        setInput(histCmd)
        if (inputRef.current) {
          inputRef.current.value = histCmd
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        const histCmd = history[history.length - 1 - newIndex] || ''
        setInput(histCmd)
        if (inputRef.current) {
          inputRef.current.value = histCmd
        }
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      }
    }
  }

  // Get prompt text
  const getPrompt = () => {
    if (currentGame) {
      return `[${currentGame.name}]$ `
    }
    return 'moyu$ '
  }

  return (
    <div className="moyu-container">
      <div className="terminal" ref={terminalRef} onClick={handleTerminalClick}>
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="btn-close"></span>
            <span className="btn-minimize"></span>
            <span className="btn-maximize"></span>
          </div>
          <div className="terminal-title">🐟 moyu@work: ~/games</div>
        </div>
        <div className="terminal-body" ref={terminalBodyRef}>
          {lines.map((line, idx) => (
            <div key={idx} className={`terminal-line ${line.type}`}>
              {line.text}
            </div>
          ))}
          <form className="terminal-input-line" onSubmit={handleSubmit}>
            <span className="prompt">{getPrompt()}</span>
            <input
              ref={inputRef}
              type="text"
              className="terminal-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
            />
          </form>
        </div>
      </div>
    </div>
  )
}

export default Moyu

