/**
 * Guess Number Game (Bulls and Cows)
 * System generates 4 unique digits (0-9)
 * Player guesses and gets XAYB feedback
 * A = correct digit in correct position
 * B = correct digit in wrong position
 */

export class GuessNumber {
  constructor() {
    this.secret = []
    this.attempts = 0
    this.history = []
    this.score = 0
    this.totalGames = 0
  }

  // Generate 4 unique random digits (0-9)
  generateSecret() {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    this.secret = []
    for (let i = 0; i < 4; i++) {
      const idx = Math.floor(Math.random() * digits.length)
      this.secret.push(digits[idx])
      digits.splice(idx, 1)
    }
    this.attempts = 0
    this.history = []
    return this.secret
  }

  // Initialize game
  init() {
    this.generateSecret()
    return [
      '┌────────────────────────────────────────┐',
      '│         🔢 Guess Number Game           │',
      '└────────────────────────────────────────┘',
      '',
      'Rules: Guess the 4-digit secret number',
      '       Each digit is 0-9, no repeats',
      '',
      'Feedback: XAYB',
      '  A = correct digit in correct position',
      '  B = correct digit in wrong position',
      '',
      'Goal: Get 4A0B to win!',
      'Scoring: 10 pts (≤5 tries), 7 pts (≤8), 5 pts (≤10), 3 pts (>10)',
      '',
      'Type 4 digits to guess, e.g. 1234',
      'Type "help" for help, "exit" to quit',
      ''
    ]
  }

  // Get help text
  getHelp() {
    return [
      '  Enter 4 digits (0-9) to guess',
      '  Each digit must be unique',
      '  Example: 1234, 0987, 5201',
      '',
      '  Feedback format: XAYB',
      '    A = digit & position both correct',
      '    B = digit correct but wrong position',
      '',
      '  Commands:',
      '    history - Show guess history',
      '    giveup  - Give up and see answer',
      '    score   - Show your score',
      ''
    ]
  }

  // Validate user input
  validateInput(input) {
    // Remove spaces
    const cleaned = input.replace(/\s/g, '')
    
    // Check length
    if (cleaned.length !== 4) {
      return { valid: false, message: '❌ Please enter exactly 4 digits' }
    }

    // Check if all digits
    if (!/^\d{4}$/.test(cleaned)) {
      return { valid: false, message: '❌ Please enter only digits (0-9)' }
    }

    // Check for duplicates
    const digits = cleaned.split('')
    const unique = new Set(digits)
    if (unique.size !== 4) {
      return { valid: false, message: '❌ Each digit must be unique (no repeats)' }
    }

    return { valid: true, digits: digits.map(Number) }
  }

  // Calculate A and B
  calculateResult(guess) {
    let a = 0
    let b = 0

    for (let i = 0; i < 4; i++) {
      if (guess[i] === this.secret[i]) {
        a++
      } else if (this.secret.includes(guess[i])) {
        b++
      }
    }

    return { a, b }
  }

  // Calculate score based on attempts
  calculateScore(attempts) {
    if (attempts <= 5) return 10
    if (attempts <= 8) return 7
    if (attempts <= 10) return 5
    return 3
  }

  // Process user input
  processInput(input) {
    const trimmed = input.trim().toLowerCase()

    // Show history
    if (trimmed === 'history') {
      if (this.history.length === 0) {
        return ['📜 No guesses yet']
      }
      return [
        '📜 Guess History:',
        ...this.history.map((h, i) => `  #${i + 1}: ${h.guess} → ${h.result}`),
        ''
      ]
    }

    // Show score
    if (trimmed === 'score') {
      return [`📊 Score: ${this.score} pts from ${this.totalGames} games`]
    }

    // Give up
    if (trimmed === 'giveup') {
      const answer = this.secret.join('')
      this.totalGames++
      this.generateSecret()
      return [
        `😔 The answer was: ${answer}`,
        '',
        '🔄 New game started!',
        'Type 4 digits to guess',
        ''
      ]
    }

    // Validate input
    const validation = this.validateInput(trimmed)
    if (!validation.valid) {
      return [validation.message]
    }

    // Process guess
    this.attempts++
    const guess = validation.digits
    const result = this.calculateResult(guess)
    const resultStr = `${result.a}A${result.b}B`
    
    // Add to history
    this.history.push({
      guess: guess.join(''),
      result: resultStr
    })

    // Check if won
    if (result.a === 4) {
      const points = this.calculateScore(this.attempts)
      this.score += points
      this.totalGames++
      
      const output = [
        `✅ ${guess.join('')} → ${resultStr}`,
        '',
        '🎉🎉🎉 Congratulations! You got it!',
        `📊 Solved in ${this.attempts} attempts → +${points} pts`,
        `📊 Total score: ${this.score} pts`,
        ''
      ]

      // Start new game
      this.generateSecret()
      output.push('🔄 New game started!')
      output.push('Type 4 digits to guess')
      output.push('')
      
      return output
    }

    // Not won yet
    return [
      `${this.attempts}. ${guess.join('')} → ${resultStr}`,
      ''
    ]
  }
}






