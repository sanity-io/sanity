import {format} from 'util'
import {getTemplates} from '../src'

beforeEach(() => {
  jest.resetModules()
})

function getConsoleSpyWithAssert() {
  const consoleSpy = jest.spyOn(global.console, 'warn')
  consoleSpy.mockImplementation((msg, ...args) =>
    expect(format(msg, ...args)).toMatchSnapshot('warning')
  )
  return {restore: () => consoleSpy.mockRestore()}
}

describe('getTemplates', () => {
  test('returns defaults if part is not implemented', () => {
    expect(getTemplates()).toMatchSnapshot()
  })

  test('returns defined templates if part implemented', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        id: 'author',
        title: 'Author',
        schemaType: 'author',
        value: {title: 'here'},
      },
      {
        serialize: () => ({
          id: 'developer',
          title: 'Developer',
          schemaType: 'developer',
          value: {title: 'Foo'},
        }),
      },
    ])
    expect(getTemplates()).toMatchSnapshot()
  })

  test('validates that templates has ID', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        title: 'Author',
        schemaType: 'author',
        value: {title: 'here'},
      },
    ])

    const consoleSpy = getConsoleSpyWithAssert()
    expect(getTemplates()).toMatchSnapshot()
    consoleSpy.restore()
  })

  test('validates that templates has title', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        id: 'author',
        schemaType: 'author',
        value: {title: 'here'},
      },
    ])

    const consoleSpy = getConsoleSpyWithAssert()
    expect(getTemplates()).toMatchSnapshot()
    consoleSpy.restore()
  })

  test('validates that templates has schema type', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        id: 'author',
        title: 'Author',
        value: {title: 'here'},
      },
    ])

    const consoleSpy = getConsoleSpyWithAssert()
    expect(getTemplates()).toMatchSnapshot()
    consoleSpy.restore()
  })

  test('validates that templates has value', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        id: 'author',
        title: 'Author',
        schemaType: 'author',
      },
    ])

    const consoleSpy = getConsoleSpyWithAssert()
    expect(getTemplates()).toMatchSnapshot()
    consoleSpy.restore()
  })

  test('validates that templates has id, title, schemaType, value', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [{}])

    const consoleSpy = getConsoleSpyWithAssert()
    expect(getTemplates()).toMatchSnapshot()
    consoleSpy.restore()
  })

  test('validates that templates has an object/function value', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        id: 'author',
        title: 'Author',
        schemaType: 'author',
        value: [],
      },
    ])

    const consoleSpy = getConsoleSpyWithAssert()
    expect(getTemplates()).toMatchSnapshot()
    consoleSpy.restore()
  })

  test('validates that templates has unique IDs', () => {
    jest.mock('part:@sanity/base/initial-value-templates?', () => [
      {
        id: 'author',
        title: 'Author',
        schemaType: 'author',
        value: {name: 'Gunnar'},
      },
      {
        id: 'author',
        title: 'Developer',
        schemaType: 'author',
        value: {role: 'developer'},
      },
    ])

    const consoleSpy = getConsoleSpyWithAssert()
    expect(getTemplates()).toMatchSnapshot()
    consoleSpy.restore()
  })
})
