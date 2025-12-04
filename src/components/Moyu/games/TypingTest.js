/**
 * Typing Test Game
 * Test typing speed with English sentences
 * Measures WPM (Words Per Minute) and accuracy
 */

// English sentences for typing practice
const SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "Pack my box with five dozen liquor jugs.",
  "How vexingly quick daft zebras jump!",
  "The five boxing wizards jump quickly.",
  "Sphinx of black quartz, judge my vow.",
  "Two driven jocks help fax my big quiz.",
  "The job requires extra pluck and zeal from every young wage earner.",
  "A mad boxer shot a quick, gloved jab to the jaw of his dizzy opponent.",
  "Crazy Frederick bought many very exquisite opal jewels.",
  "We promptly judged antique ivory buckles for the next prize.",
  "A quivering Texas zombie fought republic linked jewelry.",
  "Grumpy wizards make toxic brew for the evil queen and jack.",
  "The lazy major was fixing Cupid's broken quiver.",
  "Jack quietly moved up front and seized the big ball of wax.",
  "Few black taxis drive up major roads on quiet hazy nights.",
  "Playing jazz vibe chords quickly excites my wife.",
  "Public junk dwarves hug my quartz fox.",
  "Quick zephyrs blow, vexing daft Jim.",
  "Sympathizing would fix Quaker objectives.",
  "Whenever the black fox jumped the squirrel gazed suspiciously."
]

export class TypingTest {
  constructor() {
    this.currentSentence = ''
    this.startTime = null
    this.isTyping = false
    this.totalTests = 0
    this.bestWpm = 0
    this.totalWpm = 0
  }

  // Get random sentence
  getRandomSentence() {
    const idx = Math.floor(Math.random() * SENTENCES.length)
    return SENTENCES[idx]
  }

  // Initialize game
  init() {
    this.currentSentence = this.getRandomSentence()
    this.startTime = Date.now() // Start timer immediately
    this.isTyping = true
    
    return [
      '┌────────────────────────────────────────┐',
      '│         ⌨️  Typing Speed Test          │',
      '└────────────────────────────────────────┘',
      '',
      'Test your typing speed with English sentences!',
      '',
      'How to play:',
      '  1. Type the sentence exactly as shown',
      '  2. Press Enter when done',
      '  3. Timer starts NOW!',
      '',
      'Commands:',
      '  new   - Get a new sentence (restarts timer)',
      '  stats - Show your statistics',
      '  help  - Show this help',
      '  exit  - Quit game',
      '',
      '─'.repeat(50),
      '📝 Type this sentence (timer started!):',
      '',
      `   "${this.currentSentence}"`,
      '',
      '─'.repeat(50),
      ''
    ]
  }

  // Get help text
  getHelp() {
    return [
      '  Type the displayed sentence exactly',
      '  Case and punctuation matter!',
      '  Timer starts when you begin typing',
      '',
      '  Commands:',
      '    new   - Get a new sentence',
      '    stats - Show your statistics',
      '',
      '  Metrics:',
      '    WPM = Words Per Minute',
      '    Accuracy = Correct chars / Total chars',
      ''
    ]
  }

  // Calculate WPM and accuracy
  calculateResults(input, timeMs) {
    const words = this.currentSentence.split(' ').length
    const minutes = timeMs / 60000
    const wpm = Math.round(words / minutes)
    
    // Calculate accuracy
    let correct = 0
    const target = this.currentSentence
    const minLen = Math.min(input.length, target.length)
    
    for (let i = 0; i < minLen; i++) {
      if (input[i] === target[i]) correct++
    }
    
    const accuracy = Math.round((correct / target.length) * 100)
    
    return { wpm, accuracy, words, timeMs }
  }

  // Get performance rating
  getRating(wpm) {
    if (wpm >= 80) return '🏆 Expert!'
    if (wpm >= 60) return '🥇 Fast!'
    if (wpm >= 40) return '🥈 Good'
    if (wpm >= 25) return '🥉 Average'
    return '🐢 Keep practicing'
  }

  // Show current sentence and start timer
  showSentence() {
    // Start timer when showing sentence
    this.startTime = Date.now()
    this.isTyping = true
    return [
      '─'.repeat(50),
      '📝 Type this sentence (timer started!):',
      '',
      `   "${this.currentSentence}"`,
      '',
      '─'.repeat(50),
      ''
    ]
  }

  // Process user input
  processInput(input) {
    const trimmed = input.trim()
    const lower = trimmed.toLowerCase()

    // Commands
    if (lower === 'new') {
      this.currentSentence = this.getRandomSentence()
      this.startTime = null
      this.isTyping = false
      return [
        '🔄 New sentence:',
        ...this.showSentence()
      ]
    }

    if (lower === 'stats') {
      if (this.totalTests === 0) {
        return ['📊 No tests completed yet. Start typing!']
      }
      const avgWpm = Math.round(this.totalWpm / this.totalTests)
      return [
        '📊 Your Statistics:',
        `   Tests completed: ${this.totalTests}`,
        `   Best WPM: ${this.bestWpm}`,
        `   Average WPM: ${avgWpm}`,
        ''
      ]
    }

    // Check if this looks like a typing attempt (not a command)
    if (trimmed.length < 5 && ['help', 'exit', 'new'].includes(lower)) {
      return null // Let parent handle these commands
    }

    // Calculate results (timer started when sentence was shown)
    const endTime = Date.now()
    const timeMs = this.startTime ? endTime - this.startTime : 1000 // fallback to 1s if no start time
    const results = this.calculateResults(trimmed, timeMs)
    
    // Update stats
    this.totalTests++
    this.totalWpm += results.wpm
    if (results.wpm > this.bestWpm) {
      this.bestWpm = results.wpm
    }

    // Check if perfect match
    const isPerfect = trimmed === this.currentSentence
    
    // Prepare output
    const output = []
    
    if (isPerfect) {
      output.push('✅ Perfect!')
    } else {
      output.push('📝 Completed (with errors)')
      output.push(`   Expected : "${this.currentSentence}"`)
      output.push(`   You typed: "${trimmed}"`)
    }
    
    output.push('')
    output.push(`⏱️  Time: ${(timeMs / 1000).toFixed(2)}s`)
    output.push(`📈 Speed: ${results.wpm} WPM`)
    output.push(`🎯 Accuracy: ${results.accuracy}%`)
    output.push(`${this.getRating(results.wpm)}`)
    output.push('')
    
    // Get new sentence
    this.currentSentence = this.getRandomSentence()
    this.startTime = null
    this.isTyping = false
    
    output.push('🔄 Next sentence:')
    output.push(...this.showSentence())
    
    return output
  }
}
