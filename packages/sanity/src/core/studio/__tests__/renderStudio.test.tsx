import {type ReactElement} from 'react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

// Mock react-dom/client to capture what's rendered without actually mounting
const mockRender = vi.fn()
const mockUnmount = vi.fn()
vi.mock('react-dom/client', () => ({
  createRoot: () => ({render: mockRender, unmount: mockUnmount}),
}))

import {renderStudio} from '../renderStudio'

function createRootElement(options: {studio?: boolean; vision?: boolean} | boolean = false): HTMLElement {
  const el = document.createElement('div')
  el.id = 'sanity'
  const opts = typeof options === 'boolean' ? {studio: options, vision: false} : options
  if (opts.studio) {
    el.style.setProperty('--static-css-file-loaded-studio', '1')
  }
  if (opts.vision) {
    el.style.setProperty('--static-css-file-loaded-vision', '1')
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
 * Walks the rendered tree to find all `<link>` elements.
 */
function findLinksInTree(element: ReactElement): ReactElement[] {
  const links: ReactElement[] = []
  if (!element || typeof element !== 'object') return links
  if (element.type === 'link') {
    links.push(element)
    return links
  }
  const children = element.props?.children
  if (Array.isArray(children)) {
    for (const child of children) {
      links.push(...findLinksInTree(child))
    }
  } else if (children && typeof children === 'object') {
    links.push(...findLinksInTree(children))
  }
  return links
}

/**
 * Walks the rendered tree to find a `<link>` element.
 */
function findLinkInTree(element: ReactElement): ReactElement | null {
  const links = findLinksInTree(element)
  return links.length > 0 ? links[0] : null
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
    const root = createRootElement({studio: true, vision: true})
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
    const root = createRootElement({studio: true, vision: true})

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

  test('injects vision fallback link when --static-css-file-loaded-vision is missing', () => {
    const root = createRootElement({studio: true, vision: false})
    addImportMap({
      'sanity/': 'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/',
      '@sanity/vision/': 'https://sanity-cdn.com/v1/modules/@sanity__vision/default/%5E5.23.0/t1700000000/',
    })

    renderStudio(root, {} as any)

    const rendered = mockRender.mock.calls[0][0] as ReactElement
    const links = findLinksInTree(rendered)
    expect(links).toHaveLength(1)
    expect(links[0].props.href).toBe(
      'https://sanity-cdn.com/v1/modules/@sanity__vision/default/%5E5.23.0/t1700000000/index.css',
    )
  })

  test('injects both studio and vision fallback links when both CSS properties are missing', () => {
    const root = createRootElement({studio: false, vision: false})
    addImportMap({
      'sanity/': 'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/',
      '@sanity/vision/': 'https://sanity-cdn.com/v1/modules/@sanity__vision/default/%5E5.23.0/t1700000000/',
    })

    renderStudio(root, {} as any)

    const rendered = mockRender.mock.calls[0][0] as ReactElement
    const links = findLinksInTree(rendered)
    expect(links).toHaveLength(2)
    expect(links[0].props.href).toBe(
      'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/index.css',
    )
    expect(links[1].props.href).toBe(
      'https://sanity-cdn.com/v1/modules/@sanity__vision/default/%5E5.23.0/t1700000000/index.css',
    )
  })

  test('does not inject vision fallback when --static-css-file-loaded-vision is set', () => {
    const root = createRootElement({studio: false, vision: true})
    addImportMap({
      'sanity/': 'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/',
      '@sanity/vision/': 'https://sanity-cdn.com/v1/modules/@sanity__vision/default/%5E5.23.0/t1700000000/',
    })

    renderStudio(root, {} as any)

    const rendered = mockRender.mock.calls[0][0] as ReactElement
    const links = findLinksInTree(rendered)
    // Only studio link, no vision link
    expect(links).toHaveLength(1)
    expect(links[0].props.href).toBe(
      'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/index.css',
    )
  })

  test('does not inject vision fallback when import map lacks @sanity/vision/', () => {
    const root = createRootElement({studio: true, vision: false})
    addImportMap({
      'sanity/': 'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/',
    })

    renderStudio(root, {} as any)

    const rendered = mockRender.mock.calls[0][0] as ReactElement
    const links = findLinksInTree(rendered)
    expect(links).toHaveLength(0)
  })

  test('uses Suspense when only vision fallback is needed', () => {
    const root = createRootElement({studio: true, vision: false})
    addImportMap({
      'sanity/': 'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/',
      '@sanity/vision/': 'https://sanity-cdn.com/v1/modules/@sanity__vision/default/%5E5.23.0/t1700000000/',
    })

    renderStudio(root, {} as any)

    const rendered = mockRender.mock.calls[0][0] as ReactElement
    // Should be wrapped in Suspense since vision fallback exists
    expect(rendered.type).toBe(Symbol.for('react.suspense'))
  })
})
