import {describe, expect, test} from 'vitest'

import {transformChildren} from '../utils/transform-children'
import {onClick} from '../utils/transform-children/linkMiddleware'

describe('comments: transformChildren', () => {
  test('should create link element of link', () => {
    const result = transformChildren(['My link https://www.sanity.io'])

    expect(result).toEqual([
      'My link ',
      <a
        key="https://www.sanity.io"
        href="https://www.sanity.io"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://www.sanity.io
      </a>,
      '',
    ])
  })

  test('should create link with multiple items in the array', () => {
    const result = transformChildren(['My link ', 'https://www.sanity.io'])

    expect(result).toEqual([
      'My link ',
      '',
      <a
        key="https://www.sanity.io"
        href="https://www.sanity.io"
        onClick={onClick}
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
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://www.sanity.io
      </a>,
      ')',
    ])
  })

  test('should create link element when link is inside brackets', () => {
    const result = transformChildren(['My link [https://www.sanity.io]'])

    expect(result).toEqual([
      'My link [',
      <a
        key="https://www.sanity.io"
        href="https://www.sanity.io"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://www.sanity.io
      </a>,
      ']',
    ])
  })

  test('should create link element when link is inside parenthesis and has text', () => {
    const result = transformChildren(['My link (Sanity, https://www.sanity.io)'])

    expect(result).toEqual([
      'My link (Sanity, ',
      <a
        key="https://www.sanity.io"
        href="https://www.sanity.io"
        onClick={onClick}
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
        onClick={onClick}
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
        onClick={onClick}
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
        onClick={onClick}
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
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://www.sanity.io
      </a>,
      ' and ',
      <a
        key="https://example.com"
        href="https://example.com"
        onClick={onClick}
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
        onClick={onClick}
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
        onClick={onClick}
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
      <a
        key="www.sanity.io"
        href="https://www.sanity.io"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        www.sanity.io
      </a>,
      '',
    ])
  })

  test('should handle multiple links with varying protocols', () => {
    const result = transformChildren(['Visit http://example.com and https://sanity.io'])

    expect(result).toEqual([
      'Visit ',
      <a
        key="http://example.com"
        href="http://example.com"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        http://example.com
      </a>,
      ' and ',
      <a
        key="https://sanity.io"
        href="https://sanity.io"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://sanity.io
      </a>,
      '',
    ])
  })

  test('should handle links with subdomains', () => {
    const result = transformChildren(['Check this link https://blog.sanity.io'])

    expect(result).toEqual([
      'Check this link ',
      <a
        key="https://blog.sanity.io"
        href="https://blog.sanity.io"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://blog.sanity.io
      </a>,
      '',
    ])
  })

  test('should handle links with ports', () => {
    const result = transformChildren(['Visit http://localhost:3000 for local development'])

    expect(result).toEqual([
      'Visit ',
      <a
        key="http://localhost:3000"
        href="http://localhost:3000"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        http://localhost:3000
      </a>,
      ' for local development',
    ])
  })

  test('should handle links with fragments', () => {
    const result = transformChildren(['Go to https://sanity.io#features'])

    expect(result).toEqual([
      'Go to ',
      <a
        key="https://sanity.io#features"
        href="https://sanity.io#features"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://sanity.io#features
      </a>,
      '',
    ])
  })

  test('should handle mixed content with multiple links', () => {
    const result = transformChildren([
      'Check https://sanity.io for info and http://example.com for examples',
    ])

    expect(result).toEqual([
      'Check ',
      <a
        key="https://sanity.io"
        href="https://sanity.io"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://sanity.io
      </a>,
      ' for info and ',
      <a
        key="http://example.com"
        href="http://example.com"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        http://example.com
      </a>,
      ' for examples',
    ])
  })

  test('should handle links with hyphens', () => {
    const result = transformChildren(['Check this link https://example-site.com'])

    expect(result).toEqual([
      'Check this link ',
      <a
        key="https://example-site.com"
        href="https://example-site.com"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://example-site.com
      </a>,
      '',
    ])
  })

  test('should handle links with underscores', () => {
    const result = transformChildren(['Check this link https://example_site.com'])

    expect(result).toEqual([
      'Check this link ',
      <a
        key="https://example_site.com"
        href="https://example_site.com"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://example_site.com
      </a>,
      '',
    ])
  })

  test('should handle links with tld longer than 2 characters', () => {
    const result = transformChildren(['Check this link https://example.website'])

    expect(result).toEqual([
      'Check this link ',
      <a
        key="https://example.website"
        href="https://example.website"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://example.website
      </a>,
      '',
    ])
  })

  test('should handle multiple links with mixed content', () => {
    const result = transformChildren([
      'Visit http://example.com, https://sanity.io and www.google.com',
    ])

    expect(result).toEqual([
      'Visit ',
      <a
        key="http://example.com"
        href="http://example.com"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        http://example.com
      </a>,
      ', ',
      <a
        key="https://sanity.io"
        href="https://sanity.io"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://sanity.io
      </a>,
      ' and ',
      <a
        key="www.google.com"
        href="https://www.google.com"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        www.google.com
      </a>,
      '',
    ])
  })

  test('should handle multiple items in the array with a mix of links and text', () => {
    const result = transformChildren([
      'Hey, check out this cool site: https://www.example.com.',
      'I found some useful info here as well, ',
      'www.another-example.com',
      'Let me know what you think!',
    ])

    expect(result).toEqual([
      'Hey, check out this cool site: ',
      <a
        key="https://www.example.com"
        href="https://www.example.com"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://www.example.com
      </a>,
      '.',
      'I found some useful info here as well, ',
      '',
      <a
        key="www.another-example.com"
        href="https://www.another-example.com"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        www.another-example.com
      </a>,
      '',
      'Let me know what you think!',
    ])
  })

  test('should handle links with query parameters and fragments', () => {
    const result = transformChildren(['Check this out https://example.com/path?query=1#section'])

    expect(result).toEqual([
      'Check this out ',
      <a
        key="https://example.com/path?query=1#section"
        href="https://example.com/path?query=1#section"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        https://example.com/path?query=1#section
      </a>,
      '',
    ])
  })

  test('should handle links with IP addresses', () => {
    const result = transformChildren(['Check server at http://192.168.1.1'])

    expect(result).toEqual([
      'Check server at ',
      <a
        key="http://192.168.1.1"
        href="http://192.168.1.1"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
      >
        http://192.168.1.1
      </a>,
      '',
    ])
  })
})
