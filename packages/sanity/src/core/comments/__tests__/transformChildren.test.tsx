import {describe, expect, test} from '@jest/globals'

import {transformChildren} from '../utils'

describe('comments: transformChildren', () => {
  test('should create link elements of link', () => {
    const result = transformChildren(['My link', 'https://www.sanity.io'])

    expect(result).toEqual([
      'My link',
      '',
      <a
        key="https://www.sanity.io"
        href="https://www.sanity.io"
        rel="noopener noreferrer"
        target="_blank"
      >
        https://www.sanity.io
      </a>,
      '',
    ])
  })

  test('should create link element when link is inside parenthesis', () => {
    const result = transformChildren(['My link (https://www.sanity.io)'])

    expect(result).toEqual([
      'My link (',
      <a
        key="https://www.sanity.io"
        href="https://www.sanity.io"
        rel="noopener noreferrer"
        target="_blank"
      >
        https://www.sanity.io
      </a>,
      ')',
    ])
  })

  test('should create link element when link is inside parenthesis and has text', () => {
    const result = transformChildren(['My link (Sanity, https://www.sanity.io)'])

    expect(result).toEqual([
      'My link (Sanity, ',
      <a
        key="https://www.sanity.io"
        href="https://www.sanity.io"
        rel="noopener noreferrer"
        target="_blank"
      >
        https://www.sanity.io
      </a>,
      ')',
    ])
  })

  test('should not create link element when the link is not a valid URL', () => {
    const result = transformChildren(['My link (https://)'])

    expect(result).toEqual(['My link (https://)'])
  })

  test('should not include comma in the end of the link', () => {
    const result = transformChildren(['My link https://www.sanity.io, is a cool website'])

    expect(result).toEqual([
      'My link ',
      <a
        key="https://www.sanity.io"
        href="https://www.sanity.io"
        rel="noopener noreferrer"
        target="_blank"
      >
        https://www.sanity.io
      </a>,
      ', is a cool website',
    ])
  })

  test('should handle link at the start of the text', () => {
    const result = transformChildren(['https://www.sanity.io is a cool website'])

    expect(result).toEqual([
      '',
      <a
        key="https://www.sanity.io"
        href="https://www.sanity.io"
        rel="noopener noreferrer"
        target="_blank"
      >
        https://www.sanity.io
      </a>,
      ' is a cool website',
    ])
  })

  test('should handle link at the end of the text', () => {
    const result = transformChildren(['Check out this cool website https://www.sanity.io'])

    expect(result).toEqual([
      'Check out this cool website ',
      <a
        key="https://www.sanity.io"
        href="https://www.sanity.io"
        rel="noopener noreferrer"
        target="_blank"
      >
        https://www.sanity.io
      </a>,
      '',
    ])
  })

  test('should handle multiple links in the same string', () => {
    const result = transformChildren(['Check https://www.sanity.io and https://example.com'])

    expect(result).toEqual([
      'Check ',
      <a
        key="https://www.sanity.io"
        href="https://www.sanity.io"
        rel="noopener noreferrer"
        target="_blank"
      >
        https://www.sanity.io
      </a>,
      ' and ',
      <a
        key="https://example.com"
        href="https://example.com"
        rel="noopener noreferrer"
        target="_blank"
      >
        https://example.com
      </a>,
      '',
    ])
  })

  test('should handle links with special characters', () => {
    const result = transformChildren(['Check this link https://example.com/?query=1&sort=asc'])

    expect(result).toEqual([
      'Check this link ',
      <a
        key="https://example.com/?query=1&sort=asc"
        href="https://example.com/?query=1&sort=asc"
        rel="noopener noreferrer"
        target="_blank"
      >
        https://example.com/?query=1&sort=asc
      </a>,
      '',
    ])
  })

  test('should handle text without any links', () => {
    const result = transformChildren(['This is a text without any links.'])

    expect(result).toEqual(['This is a text without any links.'])
  })

  test('should handle empty input', () => {
    const result = transformChildren([''])

    expect(result).toEqual([''])
  })

  test('should handle http links', () => {
    const result = transformChildren(['Check this link http://www.sanity.io'])

    expect(result).toEqual([
      'Check this link ',
      <a
        key="http://www.sanity.io"
        href="http://www.sanity.io"
        rel="noopener noreferrer"
        target="_blank"
      >
        http://www.sanity.io
      </a>,
      '',
    ])
  })

  test('should handle links without protocol', () => {
    const result = transformChildren(['Check this link www.sanity.io'])

    expect(result).toEqual([
      'Check this link ',
      <a key="www.sanity.io" href="https://www.sanity.io" rel="noopener noreferrer" target="_blank">
        www.sanity.io
      </a>,
      '',
    ])
  })
})
