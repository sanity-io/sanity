import {slugOperators} from './slugOperators'

const fieldPath = 'slug'
const value = 'foo'

describe('slugOperators', () => {
  it('should create a valid filter for slugEqual', () => {
    const filter = slugOperators.slugEqual.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath}.current == "${value}"`)
  })

  it('should create a valid filter for slugMatches', () => {
    const filter = slugOperators.slugMatches.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath}.current match "${value}"`)
  })

  it('should create a valid filter for slugNotEqual', () => {
    const filter = slugOperators.slugNotEqual.groqFilter({fieldPath, value})
    expect(filter).toEqual(`${fieldPath}.current != "${value}"`)
  })

  it('should create a valid filter for slugNotMatches', () => {
    const filter = slugOperators.slugNotMatches.groqFilter({fieldPath, value})
    expect(filter).toEqual(`!(${fieldPath}.current match "${value}")`)
  })
})
