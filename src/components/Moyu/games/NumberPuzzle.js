/**
 * Number Puzzle Game
 * Find the pattern and guess the next number
 */

// Puzzle generators with answers
const PUZZLE_TYPES = [
  // Arithmetic sequences
  {
    name: 'arithmetic',
    generate: () => {
      const start = Math.floor(Math.random() * 20) + 1
      const diff = Math.floor(Math.random() * 10) + 2
      const seq = []
      for (let i = 0; i < 5; i++) seq.push(start + diff * i)
      return { sequence: seq, answer: start + diff * 5, hint: `Add ${diff} each time` }
    }
  },
  // Geometric sequences
  {
    name: 'geometric',
    generate: () => {
      const start = Math.floor(Math.random() * 5) + 1
      const ratio = Math.floor(Math.random() * 3) + 2
      const seq = []
      for (let i = 0; i < 5; i++) seq.push(start * Math.pow(ratio, i))
      return { sequence: seq, answer: start * Math.pow(ratio, 5), hint: `Multiply by ${ratio} each time` }
    }
  },
  // Square numbers
  {
    name: 'squares',
    generate: () => {
      const offset = Math.floor(Math.random() * 5)
      const seq = []
      for (let i = 1; i <= 5; i++) seq.push((i + offset) * (i + offset))
      return { sequence: seq, answer: (6 + offset) * (6 + offset), hint: 'Square numbers' }
    }
  },
  // Fibonacci-like
  {
    name: 'fibonacci',
    generate: () => {
      const a = Math.floor(Math.random() * 5) + 1
      const b = Math.floor(Math.random() * 5) + 1
      const seq = [a, b]
      for (let i = 2; i < 6; i++) seq.push(seq[i-1] + seq[i-2])
      const answer = seq[5]
      seq.pop() // Remove last to make it the answer
      return { sequence: seq, answer, hint: 'Each number = sum of previous two' }
    }
  },
  // Triangular numbers
  {
    name: 'triangular',
    generate: () => {
      const seq = []
      for (let i = 1; i <= 5; i++) seq.push(i * (i + 1) / 2)
      return { sequence: seq, answer: 6 * 7 / 2, hint: 'Triangular numbers: 1, 1+2, 1+2+3...' }
    }
  },
  // Add constant then multiply
  {
    name: 'addMultiply',
    generate: () => {
      const start = Math.floor(Math.random() * 5) + 1
      const add = Math.floor(Math.random() * 3) + 1
      const seq = [start]
      for (let i = 1; i < 5; i++) seq.push(seq[i-1] * 2 + add)
      return { sequence: seq, answer: seq[4] * 2 + add, hint: `Double and add ${add}` }
    }
  },
  // Cube numbers
  {
    name: 'cubes',
    generate: () => {
      const seq = []
      for (let i = 1; i <= 5; i++) seq.push(i * i * i)
      return { sequence: seq, answer: 6 * 6 * 6, hint: 'Cube numbers: 1³, 2³, 3³...' }
    }
  },
  // Prime numbers
  {
    name: 'primes',
    generate: () => {
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31]
      const start = Math.floor(Math.random() * 5)
      const seq = primes.slice(start, start + 5)
      return { sequence: seq, answer: primes[start + 5], hint: 'Prime numbers' }
    }
  },
  // Alternating add/subtract
  {
    name: 'alternating',
    generate: () => {
      const start = Math.floor(Math.random() * 20) + 10
      const a = Math.floor(Math.random() * 5) + 2
      const b = Math.floor(Math.random() * 3) + 1
      const seq = [start]
      for (let i = 1; i < 5; i++) {
        seq.push(i % 2 === 1 ? seq[i-1] + a : seq[i-1] - b)
      }
      return { sequence: seq, answer: seq[4] + a, hint: `Alternately add ${a} and subtract ${b}` }
    }
  },
  // Powers of 2
  {
    name: 'powersOf2',
    generate: () => {
      const start = Math.floor(Math.random() * 4)
      const seq = []
      for (let i = start; i < start + 5; i++) seq.push(Math.pow(2, i))
      return { sequence: seq, answer: Math.pow(2, start + 5), hint: 'Powers of 2' }
    }
  }
]

export class NumberPuzzle {
  constructor() {
    this.currentPuzzle = null
    this.score = 0
    this.totalPuzzles = 0
    this.streak = 0
  }

  // Generate new puzzle
  generatePuzzle() {
    const typeIdx = Math.floor(Math.random() * PUZZLE_TYPES.length)
    const puzzleType = PUZZLE_TYPES[typeIdx]
    this.currentPuzzle = puzzleType.generate()
    return this.currentPuzzle
  }

  // Initialize game
  init() {
    this.generatePuzzle()
    
    return [
      '┌────────────────────────────────────────┐',
      '│        🧩 Number Puzzle Game           │',
      '└────────────────────────────────────────┘',
      '',
      'Find the pattern and guess the next number!',
      '',
      'Commands:',
      '  [number] - Your answer',
      '  hint     - Get a hint (-1 point)',
      '  answer   - Reveal the answer (no points)',
      '  skip     - Skip to next puzzle',
      '  score    - Show your score',
      '  help     - Show this help',
      '  exit     - Quit game',
      '',
      ...this.showPuzzle()
    ]
  }

  // Get help text
  getHelp() {
    return [
      '  Look at the number sequence',
      '  Find the pattern',
      '  Enter the next number',
      '',
      '  Commands:',
      '    hint   - Get a hint (costs 1 point)',
      '    answer - See the answer (no points)',
      '    skip   - Skip this puzzle',
      '    score  - View your score',
      ''
    ]
  }

  // Display current puzzle
  showPuzzle() {
    const seq = this.currentPuzzle.sequence.join(', ')
    return [
      '─'.repeat(50),
      '🔢 What comes next?',
      '',
      `   ${seq}, ?`,
      '',
      '─'.repeat(50),
      ''
    ]
  }

  // Calculate points based on streak
  calculatePoints() {
    return 1 + Math.floor(this.streak / 3) // Bonus for streaks
  }

  // Process user input
  processInput(input) {
    const trimmed = input.trim().toLowerCase()

    // Show score
    if (trimmed === 'score') {
      return [
        '📊 Your Score:',
        `   Points: ${this.score}`,
        `   Puzzles solved: ${this.totalPuzzles}`,
        `   Current streak: ${this.streak}`,
        ''
      ]
    }

    // Get hint
    if (trimmed === 'hint') {
      if (this.score > 0) {
        this.score--
        return [
          `💡 Hint: ${this.currentPuzzle.hint}`,
          `   (-1 point, Score: ${this.score})`,
          ''
        ]
      } else {
        return [
          `💡 Hint: ${this.currentPuzzle.hint}`,
          '   (No points to deduct)',
          ''
        ]
      }
    }

    // Show answer
    if (trimmed === 'answer') {
      const answer = this.currentPuzzle.answer
      const hint = this.currentPuzzle.hint
      this.streak = 0
      this.generatePuzzle()
      return [
        `📖 Answer: ${answer}`,
        `   Pattern: ${hint}`,
        '',
        '🔄 Next puzzle:',
        ...this.showPuzzle()
      ]
    }

    // Skip puzzle
    if (trimmed === 'skip') {
      this.streak = 0
      this.generatePuzzle()
      return [
        '⏭️ Skipped',
        '',
        '🔄 Next puzzle:',
        ...this.showPuzzle()
      ]
    }

    // Try to parse as number
    const num = parseInt(trimmed, 10)
    if (isNaN(num)) {
      return [`❌ Please enter a number or a command`]
    }

    // Check answer
    if (num === this.currentPuzzle.answer) {
      this.streak++
      const points = this.calculatePoints()
      this.score += points
      this.totalPuzzles++
      
      const output = [
        `✅ Correct! The answer is ${num}`,
        `   Pattern: ${this.currentPuzzle.hint}`,
        `   +${points} point${points > 1 ? 's' : ''} (Streak: ${this.streak})`,
        `   Total score: ${this.score}`,
        ''
      ]
      
      this.generatePuzzle()
      output.push('🔄 Next puzzle:')
      output.push(...this.showPuzzle())
      
      return output
    } else {
      return [
        `❌ ${num} is not correct. Try again!`,
        `   Sequence: ${this.currentPuzzle.sequence.join(', ')}, ?`,
        ''
      ]
    }
  }
}
