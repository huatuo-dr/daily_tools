/**
 * Math Quiz Game
 * Quick arithmetic challenges with time limit
 * Supports +, -, *, / operations
 */

export class MathQuiz {
  constructor() {
    this.currentProblem = null
    this.score = 0
    this.totalQuestions = 0
    this.correctAnswers = 0
    this.streak = 0
    this.bestStreak = 0
    this.problemStartTime = null
    this.gameStartTime = null
    this.timeLimit = 60 // Default 60 seconds
    this.difficulty = 'normal' // easy, normal, hard
    this.isGameOver = false
  }

  // Generate a random math problem
  generateProblem() {
    const ops = ['+', '-', '*', '/']
    const op = ops[Math.floor(Math.random() * ops.length)]
    
    let a, b, answer
    
    switch (this.difficulty) {
      case 'easy':
        // Easy: single digit, no negative results
        a = Math.floor(Math.random() * 10) + 1
        b = Math.floor(Math.random() * 10) + 1
        break
      case 'hard':
        // Hard: larger numbers
        a = Math.floor(Math.random() * 50) + 10
        b = Math.floor(Math.random() * 30) + 5
        break
      default: // normal
        a = Math.floor(Math.random() * 20) + 1
        b = Math.floor(Math.random() * 15) + 1
    }

    // Adjust numbers based on operation
    switch (op) {
      case '+':
        answer = a + b
        break
      case '-':
        // Ensure non-negative result
        if (a < b) [a, b] = [b, a]
        answer = a - b
        break
      case '*':
        // Keep multiplication reasonable
        if (this.difficulty === 'easy') {
          a = Math.floor(Math.random() * 10) + 1
          b = Math.floor(Math.random() * 10) + 1
        } else if (this.difficulty === 'normal') {
          a = Math.floor(Math.random() * 12) + 1
          b = Math.floor(Math.random() * 12) + 1
        }
        answer = a * b
        break
      case '/':
        // Ensure clean division (no decimals)
        answer = Math.floor(Math.random() * 12) + 1
        b = Math.floor(Math.random() * 12) + 1
        a = answer * b
        break
    }

    this.currentProblem = { a, b, op, answer }
    this.problemStartTime = Date.now()
    return this.currentProblem
  }

  // Check if game time is up
  isTimeUp() {
    if (!this.gameStartTime) return false
    const elapsed = (Date.now() - this.gameStartTime) / 1000
    return elapsed >= this.timeLimit
  }

  // Get remaining time
  getRemainingTime() {
    if (!this.gameStartTime) return this.timeLimit
    const elapsed = (Date.now() - this.gameStartTime) / 1000
    return Math.max(0, this.timeLimit - elapsed)
  }

  // Format time as MM:SS
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // End game and show results
  endGame() {
    this.isGameOver = true
    const accuracy = this.totalQuestions > 0 
      ? Math.round((this.correctAnswers / this.totalQuestions) * 100) 
      : 0
    
    return [
      '',
      '═'.repeat(45),
      '⏰ TIME\'S UP! Game Over!',
      '═'.repeat(45),
      '',
      '📊 Final Results:',
      `   ⭐ Score: ${this.score} pts`,
      `   📝 Questions: ${this.totalQuestions}`,
      `   ✅ Correct: ${this.correctAnswers}`,
      `   🎯 Accuracy: ${accuracy}%`,
      `   🔥 Best streak: ${this.bestStreak}`,
      '',
      '─'.repeat(45),
      'Type "restart" to play again, or "exit" to quit',
      ''
    ]
  }

  // Restart game
  restart() {
    this.score = 0
    this.totalQuestions = 0
    this.correctAnswers = 0
    this.streak = 0
    this.bestStreak = 0
    this.isGameOver = false
    this.gameStartTime = Date.now()
    this.generateProblem()
    
    return [
      '🔄 Game restarted!',
      `⏱️ Time limit: ${this.timeLimit} seconds`,
      '',
      ...this.showProblem()
    ]
  }

  // Initialize game
  init() {
    this.gameStartTime = Date.now()
    this.isGameOver = false
    this.generateProblem()
    
    return [
      '┌────────────────────────────────────────┐',
      '│          🧮 Math Quiz Game             │',
      '└────────────────────────────────────────┘',
      '',
      `⏱️ Time limit: ${this.timeLimit} seconds - GO!`,
      '',
      'Scoring:',
      '  Correct answer: +10 pts',
      '  Speed bonus: +1~5 pts (faster = more)',
      '  Streak bonus: +2 pts per 3 correct in a row',
      '',
      'Commands:',
      '  [number]  - Your answer',
      '  time N    - Set time limit to N seconds',
      '  easy/normal/hard - Change difficulty',
      '  score     - Show current stats',
      '  skip      - Skip current problem',
      '  restart   - Restart game',
      '  help/exit - Help or quit',
      '',
      `Difficulty: ${this.difficulty.toUpperCase()}`,
      '',
      ...this.showProblem()
    ]
  }

  // Get help text
  getHelp() {
    return [
      '  Answer math problems before time runs out!',
      '  Faster answers = more points!',
      '',
      '  Commands:',
      '    time N  - Set time limit (e.g. time 30)',
      '    easy/normal/hard - Change difficulty',
      '    skip    - Skip current problem',
      '    score   - View current statistics',
      '    restart - Restart with new timer',
      ''
    ]
  }

  // Display current problem with remaining time
  showProblem() {
    const { a, b, op } = this.currentProblem
    const opSymbol = op === '*' ? '×' : op === '/' ? '÷' : op
    const remaining = Math.ceil(this.getRemainingTime())
    return [
      '─'.repeat(40),
      `⏱️ Time left: ${this.formatTime(remaining)}`,
      '',
      `   🔢  ${a} ${opSymbol} ${b} = ?`,
      '',
      '─'.repeat(40),
      ''
    ]
  }

  // Calculate speed bonus (1-5 points based on response time)
  calculateSpeedBonus(timeMs) {
    const seconds = timeMs / 1000
    if (seconds < 2) return 5
    if (seconds < 4) return 4
    if (seconds < 6) return 3
    if (seconds < 10) return 2
    return 1
  }

  // Process user input
  processInput(input) {
    const trimmed = input.trim().toLowerCase()

    // Handle restart
    if (trimmed === 'restart') {
      return this.restart()
    }

    // Handle time setting (time N)
    if (trimmed.startsWith('time ')) {
      const newTime = parseInt(trimmed.split(' ')[1], 10)
      if (isNaN(newTime) || newTime < 10 || newTime > 300) {
        return ['❌ Please enter a valid time (10-300 seconds)', '   Example: time 60']
      }
      this.timeLimit = newTime
      return [
        `✅ Time limit set to: ${newTime} seconds`,
        '   Type "restart" to start a new game with this setting',
        ''
      ]
    }

    // If game is over, only allow restart or exit
    if (this.isGameOver) {
      if (trimmed === 'restart') {
        return this.restart()
      }
      return ['⏰ Game over! Type "restart" to play again, or "exit" to quit']
    }

    // Check if time is up
    if (this.isTimeUp()) {
      return this.endGame()
    }

    // Change difficulty
    if (['easy', 'normal', 'hard'].includes(trimmed)) {
      this.difficulty = trimmed
      this.generateProblem()
      return [
        `✅ Difficulty set to: ${trimmed.toUpperCase()}`,
        '',
        ...this.showProblem()
      ]
    }

    // Show score
    if (trimmed === 'score') {
      const accuracy = this.totalQuestions > 0 
        ? Math.round((this.correctAnswers / this.totalQuestions) * 100) 
        : 0
      const remaining = Math.ceil(this.getRemainingTime())
      return [
        '📊 Current Statistics:',
        `   ⏱️ Time left: ${this.formatTime(remaining)}`,
        `   ⭐ Score: ${this.score} pts`,
        `   📝 Questions: ${this.totalQuestions}`,
        `   ✅ Correct: ${this.correctAnswers}`,
        `   🎯 Accuracy: ${accuracy}%`,
        `   🔥 Current streak: ${this.streak}`,
        ''
      ]
    }

    // Skip problem
    if (trimmed === 'skip') {
      // Check time again before processing
      if (this.isTimeUp()) {
        return this.endGame()
      }
      
      const { a, b, op, answer } = this.currentProblem
      const opSymbol = op === '*' ? '×' : op === '/' ? '÷' : op
      this.streak = 0
      this.totalQuestions++
      this.generateProblem()
      return [
        `⏭️ Skipped! The answer was: ${a} ${opSymbol} ${b} = ${answer}`,
        '',
        ...this.showProblem()
      ]
    }

    // Try to parse as number
    const userAnswer = parseInt(trimmed, 10)
    if (isNaN(userAnswer)) {
      return ['❌ Please enter a number or a command']
    }

    // Check time again before processing answer
    if (this.isTimeUp()) {
      return this.endGame()
    }

    // Calculate time taken for this problem
    const endTime = Date.now()
    const timeMs = endTime - this.problemStartTime
    const timeStr = (timeMs / 1000).toFixed(2)

    this.totalQuestions++
    const { a, b, op, answer } = this.currentProblem
    const opSymbol = op === '*' ? '×' : op === '/' ? '÷' : op

    // Check answer
    if (userAnswer === answer) {
      this.correctAnswers++
      this.streak++
      if (this.streak > this.bestStreak) {
        this.bestStreak = this.streak
      }

      // Calculate points
      let points = 10
      const speedBonus = this.calculateSpeedBonus(timeMs)
      points += speedBonus
      
      // Streak bonus
      const streakBonus = Math.floor(this.streak / 3) * 2
      points += streakBonus

      this.score += points

      const output = [
        `✅ Correct! ${a} ${opSymbol} ${b} = ${answer}`,
        `   ⏱️ Time: ${timeStr}s | +${points} pts`,
        `   🔥 Streak: ${this.streak}`,
        ''
      ]

      // Check if time is up after answering
      if (this.isTimeUp()) {
        output.push(...this.endGame())
        return output
      }

      this.generateProblem()
      output.push(...this.showProblem())
      return output

    } else {
      this.streak = 0
      
      const output = [
        `❌ Wrong! ${a} ${opSymbol} ${b} = ${answer} (you: ${userAnswer})`,
        `   Streak reset`,
        ''
      ]

      // Check if time is up after answering
      if (this.isTimeUp()) {
        output.push(...this.endGame())
        return output
      }

      this.generateProblem()
      output.push(...this.showProblem())
      return output
    }
  }
}

