/**
 * 24 Point Game
 * Given 4 numbers (1-13), use +, -, *, / to get 24
 */

export class Game24 {
  constructor() {
    this.numbers = []
    this.score = 0
    this.attempts = 0
  }

  // Generate 4 random numbers (1-13)
  generateNumbers() {
    this.numbers = Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1)
    return this.numbers
  }

  // Initialize game
  init() {
    this.generateNumbers()
    return [
      '┌────────────────────────────────────────┐',
      '│           🎯 Point 24 Game             │',
      '└────────────────────────────────────────┘',
      '',
      'Rules: Use all 4 numbers with + - * / to make 24',
      '       Each number must be used exactly once',
      '       Parentheses allowed to change order',
      '',
      'Example: [1, 2, 3, 4] -> (1+2+3)*4',
      '         If no solution, type: xxxx',
      '',
      'Type "help" for help, "exit" to quit',
      '',
      this.getNumbersDisplay(),
      ''
    ]
  }

  // Get help text
  getHelp() {
    return [
      '  Use 4 numbers and operators (+-*/) to get 24',
      '  Each number must be used exactly once',
      '  Parentheses allowed, e.g. (1+2)*3*4',
      '  If no solution exists, type: xxxx',
      '  Type "skip" to skip current puzzle',
      '  Type "score" to check your score',
      ''
    ]
  }

  // Display current numbers
  getNumbersDisplay() {
    return `🎲 Numbers: [ ${this.numbers.join(' , ')} ]`
  }

  // Check if expression uses exactly the given numbers
  validateNumbers(expression) {
    // Extract all numbers from expression
    const numbersInExpr = expression.match(/\d+/g)?.map(Number) || []
    
    if (numbersInExpr.length !== 4) {
      return { valid: false, message: '❌ Must use exactly 4 numbers' }
    }

    // Sort both arrays and compare
    const sortedInput = [...numbersInExpr].sort((a, b) => a - b)
    const sortedTarget = [...this.numbers].sort((a, b) => a - b)

    for (let i = 0; i < 4; i++) {
      if (sortedInput[i] !== sortedTarget[i]) {
        return { valid: false, message: `❌ Must use given numbers: [${this.numbers.join(', ')}]` }
      }
    }

    return { valid: true }
  }

  // Safely evaluate expression
  evaluateExpression(expr) {
    // Only allow numbers, operators, parentheses and spaces
    const sanitized = expr.replace(/\s/g, '')
    if (!/^[\d+\-*/().]+$/.test(sanitized)) {
      return { success: false, error: '❌ Expression contains invalid characters' }
    }

    try {
      // Replace × with * and ÷ with /
      const normalized = sanitized.replace(/×/g, '*').replace(/÷/g, '/')
      // Use Function constructor for safe evaluation
      const result = Function('"use strict"; return (' + normalized + ')')()
      
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        return { success: false, error: '❌ Expression evaluation error' }
      }
      
      return { success: true, result }
    } catch (e) {
      return { success: false, error: '❌ Syntax error: ' + e.message }
    }
  }

  // Check if current numbers have a solution (brute force)
  hasSolution() {
    const ops = ['+', '-', '*', '/']
    const nums = this.numbers

    // Generate all permutations of 4 numbers
    const permutations = this.getPermutations(nums)

    for (const perm of permutations) {
      const [a, b, c, d] = perm
      
      // Try all operator combinations (4^3 = 64)
      for (const op1 of ops) {
        for (const op2 of ops) {
          for (const op3 of ops) {
            // Try different bracket arrangements
            const expressions = [
              `((${a}${op1}${b})${op2}${c})${op3}${d}`,
              `(${a}${op1}(${b}${op2}${c}))${op3}${d}`,
              `(${a}${op1}${b})${op2}(${c}${op3}${d})`,
              `${a}${op1}((${b}${op2}${c})${op3}${d})`,
              `${a}${op1}(${b}${op2}(${c}${op3}${d}))`
            ]

            for (const expr of expressions) {
              try {
                const result = Function('"use strict"; return (' + expr + ')')()
                if (Math.abs(result - 24) < 0.0001) {
                  return { hasSolution: true, example: expr }
                }
              } catch {
                // Ignore evaluation errors
              }
            }
          }
        }
      }
    }

    return { hasSolution: false }
  }

  // Get all permutations of an array
  getPermutations(arr) {
    if (arr.length <= 1) return [arr]
    const result = []
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
      for (const perm of this.getPermutations(rest)) {
        result.push([arr[i], ...perm])
      }
    }
    return result
  }

  // Process user input
  processInput(input) {
    const trimmed = input.trim().toLowerCase()
    this.attempts++

    // Check score
    if (trimmed === 'score') {
      return [`📊 Score: ${this.score} pts, ${this.attempts} attempts`]
    }

    // Skip current puzzle
    if (trimmed === 'skip') {
      const solution = this.hasSolution()
      let output = ['⏭️ Skipped']
      
      if (solution.hasSolution) {
        output.push(`💡 One solution: ${solution.example}`)
      } else {
        output.push('💡 This puzzle had no solution')
      }
      
      this.generateNumbers()
      output.push('')
      output.push(this.getNumbersDisplay())
      output.push('')
      return output
    }

    // User claims no solution
    if (trimmed === 'xxxx') {
      const solution = this.hasSolution()
      
      if (!solution.hasSolution) {
        // Correct! No solution exists
        this.score += 1
        this.generateNumbers()
        return [
          '🎉 Correct! No solution exists!',
          `📊 +1 point, Total: ${this.score}`,
          '',
          'Next challenge:',
          this.getNumbersDisplay(),
          ''
        ]
      } else {
        // Wrong, solution exists
        return [
          '❌ Wrong! A solution exists~',
          '💡 Hint: Try again, or type "skip"',
          '',
          this.getNumbersDisplay(),
          ''
        ]
      }
    }

    // Validate numbers in expression
    const validation = this.validateNumbers(trimmed)
    if (!validation.valid) {
      return [
        validation.message,
        this.getNumbersDisplay(),
        ''
      ]
    }

    // Evaluate expression
    const evalResult = this.evaluateExpression(trimmed)
    if (!evalResult.success) {
      return [
        evalResult.error,
        'Please check your expression format',
        ''
      ]
    }

    const result = evalResult.result

    // Check if result is 24
    if (Math.abs(result - 24) < 0.0001) {
      this.score += 1
      this.generateNumbers()
      return [
        `✅ ${trimmed} = ${result}`,
        '🎉🎉🎉 Correct! Well done!',
        `📊 +1 point, Total: ${this.score}`,
        '',
        'Next challenge:',
        this.getNumbersDisplay(),
        ''
      ]
    } else {
      return [
        `❌ ${trimmed} = ${result}`,
        `   Result is ${result}, not 24. Try again!`,
        '',
        this.getNumbersDisplay(),
        ''
      ]
    }
  }
}

