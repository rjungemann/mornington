// Original from https://github.com/cruhr/diceparser

const DEFAULT_DICE = '1d6'
const DEFAULT_FACES = 6
const DEFAULT_SEPARATOR = 'D'
const DEFAULT_RANDOM_FN = () => Math.random()

type DiceResult = {
  die: string
  result: number
}

type Options = {
  separator: string
  defaultFaces: number
  randomFn: () => number
}

const defaulOptions = {
  separator: DEFAULT_SEPARATOR,
  defaultFaces: DEFAULT_FACES,
  randomFn: DEFAULT_RANDOM_FN
}

export const rollDice = (
  str: string = DEFAULT_DICE,
  {
    separator = DEFAULT_SEPARATOR,
    defaultFaces = DEFAULT_FACES,
    randomFn = DEFAULT_RANDOM_FN
  }: Partial<Options> = defaulOptions
) => {
  const tokenizedString = Array.from(str.toLowerCase())

  let sum = 0
  let multiplier = 0
  let currentNumber = ''

  const diceArray: DiceResult[] = []

  /**
   * rolls the dice or adds a flat value to the sum
   */
  const rollOrAdd = (num: number) => {
    if (multiplier) {
      const dice = num || defaultFaces
      for (let i = 0; i < multiplier; i++) {
        const result = Math.ceil(randomFn() * dice)
        sum += result

        diceArray.push({
          die: `${separator.toUpperCase()}${dice}`,
          result,
        })
      }
    }

    // not encoutered the "d", the current number is only a stright addition
    if (!multiplier) {
      sum += num
    }
  }

  for (let c of tokenizedString) {
    const isNumber = !isNaN(c as any)

    if (c === ' ') {
      // we ignore spaces
    } else if (c === '+') {
      // next dice or addition - roll/add
      rollOrAdd(parseInt(currentNumber, 10))
      // reset temporary values
      multiplier = 0
      currentNumber = ''
    } else if (c === separator.toLowerCase()) {
      // separator between multiplier and dice value
      multiplier = currentNumber.length ? parseInt(currentNumber, 10) : 1
      // reset current number
      currentNumber = ''
    } else if (isNumber) {
      // just a number, add to "current number" string
      currentNumber += c
    } else {
      // encountered not-known character - PANIC!
      throw new Error(
        `Unknown character in dice string "${str}". Please use only numbers, "+" and "${separator}"`
      )
    }
  }

  rollOrAdd(parseInt(currentNumber, 10))

  return {
    sum,
    dice: diceArray,
  }
}