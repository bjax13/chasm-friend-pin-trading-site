import { PIN_NAMES, isPinName, pinLabel } from '../pins'

describe('PIN_NAMES', () => {
  it('contains exactly 5 pins', () => {
    expect(PIN_NAMES).toHaveLength(5)
  })

  it('contains all expected pin names', () => {
    expect(PIN_NAMES).toEqual(
      expect.arrayContaining(['Howlerina', 'Shredhead', 'Burpslurper', 'Cleverclaws', 'Darren'])
    )
  })

  it('is an array of strings', () => {
    PIN_NAMES.forEach(pin => expect(typeof pin).toBe('string'))
  })
})

describe('isPinName', () => {
  it('returns true for each valid pin name', () => {
    const validPins = ['Howlerina', 'Shredhead', 'Burpslurper', 'Cleverclaws', 'Darren']
    validPins.forEach(pin => {
      expect(isPinName(pin)).toBe(true)
    })
  })

  it('returns false for an invalid string', () => {
    expect(isPinName('NotAPin')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isPinName('')).toBe(false)
  })

  it('is case-sensitive — lowercase does not match', () => {
    expect(isPinName('howlerina')).toBe(false)
    expect(isPinName('darren')).toBe(false)
  })

  it('returns false for partial matches', () => {
    expect(isPinName('Howler')).toBe(false)
    expect(isPinName('DarrenExtra')).toBe(false)
  })

  it('returns false for whitespace-padded pin names', () => {
    expect(isPinName(' Darren')).toBe(false)
    expect(isPinName('Darren ')).toBe(false)
  })
})

describe('pinLabel', () => {
  it('returns the pin name unchanged', () => {
    expect(pinLabel('Howlerina')).toBe('Howlerina')
    expect(pinLabel('Darren')).toBe('Darren')
    expect(pinLabel('Burpslurper')).toBe('Burpslurper')
  })

  it('returns the same string that was passed in', () => {
    PIN_NAMES.forEach(pin => {
      expect(pinLabel(pin)).toBe(pin)
    })
  })
})
