import {describe, expect, it} from 'vitest'

import {interpolateTemplate} from '../interpolateTemplate'

describe('interpolateTemplate', () => {
  it('should replace single variable', () => {
    const result = interpolateTemplate('Hello {{name}}', {name: 'World'})
    expect(result).toBe('Hello World')
  })

  it('should replace multiple variables', () => {
    const result = interpolateTemplate('{{baseUrl}}/contact/{{projectId}}', {
      baseUrl: 'https://sanity.io',
      projectId: 'abc123',
    })
    expect(result).toBe('https://sanity.io/contact/abc123')
  })

  it('should handle number values', () => {
    const result = interpolateTemplate('Limit: {{limit}}', {limit: 5})
    expect(result).toBe('Limit: 5')
  })

  it('should preserve missing variables as placeholders', () => {
    const result = interpolateTemplate('{{existing}} and {{missing}}', {existing: 'found'})
    expect(result).toBe('found and {{missing}}')
  })

  it('should handle empty template', () => {
    const result = interpolateTemplate('', {key: 'value'})
    expect(result).toBe('')
  })

  it('should handle template with no variables', () => {
    const result = interpolateTemplate('No variables here', {key: 'value'})
    expect(result).toBe('No variables here')
  })

  it('should handle empty values object', () => {
    const result = interpolateTemplate('{{key}}', {})
    expect(result).toBe('{{key}}')
  })

  it('should handle real-world URL template', () => {
    const result = interpolateTemplate('{{baseUrl}}/contact/sales?ref=content-releases', {
      baseUrl: 'https://www.sanity.io',
    })
    expect(result).toBe('https://www.sanity.io/contact/sales?ref=content-releases')
  })

  it('should handle adjacent variables', () => {
    const result = interpolateTemplate('{{a}}{{b}}', {a: 'Hello', b: 'World'})
    expect(result).toBe('HelloWorld')
  })

  it('should handle same variable multiple times', () => {
    const result = interpolateTemplate('{{x}} and {{x}} again', {x: 'value'})
    expect(result).toBe('value and value again')
  })
})
