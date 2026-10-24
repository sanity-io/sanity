import {afterEach, describe, expect, it} from 'vitest'

import {toLcpElementKind} from '../lcpElementKind'

function mount(html: string, selector: string): Element | null {
  document.body.innerHTML = html
  return document.querySelector(selector)
}

describe('toLcpElementKind', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('reads the document title heading as title, although it sits inside the form', () => {
    const element = mount(
      '<div data-testid="form-view"><h2 data-testid="document-panel-document-title"><span id="text">Winnie</span></h2></div>',
      '#text',
    )

    expect(toLcpElementKind({element, url: ''})).toBe('title')
  })

  it('reads an editable title field as title', () => {
    const element = mount(
      '<div data-testid="form-view"><button data-testid="document-panel-document-title-field">Winnie</button></div>',
      'button',
    )

    expect(toLcpElementKind({element, url: ''})).toBe('title')
  })

  it('reads a painted image as image', () => {
    const element = mount(
      '<div data-testid="form-view"><img src="https://cdn.sanity.io/bear.avif" /></div>',
      'img',
    )

    expect(toLcpElementKind({element, url: 'https://cdn.sanity.io/bear.avif'})).toBe('image')
  })

  it('reads other form content as field', () => {
    const element = mount('<div data-testid="form-view"><p>Long text</p></div>', 'p')

    expect(toLcpElementKind({element, url: ''})).toBe('field')
  })

  it('reads anything outside the form as other', () => {
    const element = mount('<header><h1>Books</h1></header>', 'h1')

    expect(toLcpElementKind({element, url: ''})).toBe('other')
  })

  it('reads a detached element as other', () => {
    expect(toLcpElementKind({element: null, url: ''})).toBe('other')
  })
})
