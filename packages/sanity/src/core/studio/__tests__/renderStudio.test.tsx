import {type ReactElement} from 'react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

// Mock react-dom/client to capture what's rendered without actually mounting
const mockRender = vi.fn()
const mockUnmount = vi.fn()
vi.mock('react-dom/client', () => ({
  createRoot: () => ({render: mockRender, unmount: mockUnmount}),
}))

import {renderStudio} from '../renderStudio'

function createRootElement(cssPropertySet = false): HTMLElement {
  const el = document.createElement('div')
  el.id = 'sanity'
  if (cssPropertySet) {
    el.style.setProperty('--static-css-file-loaded-studio', '1')
  }
  document.body.appendChild(el)
  return el
}

function addImportMap(imports: Record<string, string>) {
  const script = document.createElement('script')
  script.type = 'importmap'
  script.textContent = JSON.stringify({imports})
  document.head.appendChild(script)
}

/**
 * Walks the rendered tree to find a `<link>` element with the given props.
 */
function findLinkInTree(element: ReactElement): ReactElement | null {
  if (!element || typeof element !== 'object') return null
  if (element.type === 'link') return element
  const children = element.props?.children
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findLinkInTree(child)
      if (found) return found
    }
  } else if (children && typeof children === 'object') {
    return findLinkInTree(children)
  }
  return null
}

describe('renderStudio', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
    mockRender.mockClear()
    mockUnmount.mockClear()
  })

  afterEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  test('throws when rootElement is null', () => {
    expect(() => renderStudio(null, {} as any)).toThrow(
      'Missing root element to mount application into',
    )
  })

  test('does not inject fallback link when --static-css-file-loaded-studio is set', () => {
    const root = createRootElement(true)
    addImportMap({
      'sanity/': 'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/',
    })

    renderStudio(root, {} as any)

    expect(mockRender).toHaveBeenCalledTimes(1)
    const rendered = mockRender.mock.calls[0][0] as ReactElement
    expect(findLinkInTree(rendered)).toBeNull()
  })

  test('injects fallback link when CSS property is missing and import map has sanity/', () => {
    const root = createRootElement(false)
    addImportMap({
      'sanity/': 'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/',
    })

    renderStudio(root, {} as any)

    expect(mockRender).toHaveBeenCalledTimes(1)
    const rendered = mockRender.mock.calls[0][0] as ReactElement
    const link = findLinkInTree(rendered)
    expect(link).not.toBeNull()
    expect(link!.props.rel).toBe('stylesheet')
    expect(link!.props.href).toBe(
      'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/index.css',
    )
    expect(link!.props.precedence).toBe('sanity')
  })

  test('does not inject fallback link when CSS property is missing but import map lacks sanity/', () => {
    const root = createRootElement(false)
    addImportMap({'other-package/': 'https://example.com/pkg/'})

    renderStudio(root, {} as any)

    expect(mockRender).toHaveBeenCalledTimes(1)
    const rendered = mockRender.mock.calls[0][0] as ReactElement
    expect(findLinkInTree(rendered)).toBeNull()
  })

  test('does not inject fallback link when no import map exists', () => {
    const root = createRootElement(false)

    renderStudio(root, {} as any)

    expect(mockRender).toHaveBeenCalledTimes(1)
    const rendered = mockRender.mock.calls[0][0] as ReactElement
    expect(findLinkInTree(rendered)).toBeNull()
  })

  test('returns an unmount function', () => {
    const root = createRootElement(true)

    const unmount = renderStudio(root, {} as any)
    unmount()

    expect(mockUnmount).toHaveBeenCalledTimes(1)
  })

  test('derives correct CSS URL for by-app URL pattern', () => {
    const root = createRootElement(false)
    addImportMap({
      'sanity/':
        'https://sanity-cdn.com/v1/modules/by-app/abc123/t1700000000/%5E5.23.0/sanity/',
    })

    renderStudio(root, {} as any)

    const rendered = mockRender.mock.calls[0][0] as ReactElement
    const link = findLinkInTree(rendered)
    expect(link).not.toBeNull()
    expect(link!.props.href).toBe(
      'https://sanity-cdn.com/v1/modules/by-app/abc123/t1700000000/%5E5.23.0/sanity/index.css',
    )
  })
})
