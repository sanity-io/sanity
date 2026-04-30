import {type ReactElement} from 'react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

// Mock react-dom/client to capture what's rendered without actually mounting
const mockRender = vi.fn()
const mockUnmount = vi.fn()
vi.mock('react-dom/client', () => ({
  createRoot: () => ({render: mockRender, unmount: mockUnmount}),
}))

import {renderStudio} from '../renderStudio'

const SANITY_IMPORT_MAP_URL =
  'https://sanity-cdn.com/v1/modules/sanity/default/%5E5.23.0/t1700000000/'
const VISION_IMPORT_MAP_URL =
  'https://sanity-cdn.com/v1/modules/@sanity__vision/default/%5E5.23.0/t1700000000/'
const SANITY_BY_APP_IMPORT_MAP_URL =
  'https://sanity-cdn.com/v1/modules/by-app/abc123/t1700000000/%5E5.23.0/sanity/'

function createRootElement(options: {studio?: boolean; vision?: boolean} = {}): HTMLElement {
  const el = document.createElement('div')
  el.id = 'sanity'
  if (options.studio) {
    el.style.setProperty('--static-css-file-loaded-studio', '1')
  }
  if (options.vision) {
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
 * Walks the rendered tree to find all `<link>` elements with their props.
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

  test('returns an unmount function that calls root.unmount()', () => {
    const root = createRootElement({studio: true, vision: true})
    const unmount = renderStudio(root, {} as any)
    unmount()
    expect(mockUnmount).toHaveBeenCalledTimes(1)
  })

  describe('studio CSS fallback', () => {
    test('injects a stylesheet link derived from the import map when --static-css-file-loaded-studio is missing', () => {
      const root = createRootElement()
      addImportMap({'sanity/': SANITY_IMPORT_MAP_URL})

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(1)
      expect(links[0].props.rel).toBe('stylesheet')
      expect(links[0].props.href).toBe(`${SANITY_IMPORT_MAP_URL}index.css`)
      expect(links[0].props.precedence).toBe('sanity')
    })

    test('injects for the by-app URL pattern as well', () => {
      const root = createRootElement()
      addImportMap({'sanity/': SANITY_BY_APP_IMPORT_MAP_URL})

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(1)
      expect(links[0].props.href).toBe(`${SANITY_BY_APP_IMPORT_MAP_URL}index.css`)
    })

    test('does not inject when --static-css-file-loaded-studio is set', () => {
      const root = createRootElement({studio: true, vision: true})
      addImportMap({'sanity/': SANITY_IMPORT_MAP_URL})

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(0)
    })

    test('does not inject when the import map has no matching sanity/ entry', () => {
      const root = createRootElement()
      addImportMap({'other-package/': 'https://example.com/pkg/'})

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(0)
    })

    test('does not inject when no import map exists in the document', () => {
      const root = createRootElement()

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(0)
    })
  })

  describe('vision CSS fallback', () => {
    test('injects a stylesheet link derived from the import map when --static-css-file-loaded-vision is missing', () => {
      const root = createRootElement({studio: true})
      addImportMap({
        'sanity/': SANITY_IMPORT_MAP_URL,
        '@sanity/vision/': VISION_IMPORT_MAP_URL,
      })

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(1)
      expect(links[0].props.rel).toBe('stylesheet')
      expect(links[0].props.href).toBe(`${VISION_IMPORT_MAP_URL}index.css`)
      expect(links[0].props.precedence).toBe('sanity')
    })

    test('does not inject when --static-css-file-loaded-vision is set', () => {
      const root = createRootElement({studio: true, vision: true})
      addImportMap({
        'sanity/': SANITY_IMPORT_MAP_URL,
        '@sanity/vision/': VISION_IMPORT_MAP_URL,
      })

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(0)
    })

    test('does not inject when the import map has no @sanity/vision/ entry', () => {
      const root = createRootElement({studio: true})
      addImportMap({'sanity/': SANITY_IMPORT_MAP_URL})

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(0)
    })
  })

  describe('combined studio and vision CSS fallback', () => {
    test('injects both links when both CSS properties are missing', () => {
      const root = createRootElement()
      addImportMap({
        'sanity/': SANITY_IMPORT_MAP_URL,
        '@sanity/vision/': VISION_IMPORT_MAP_URL,
      })

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(2)
      expect(links[0].props.href).toBe(`${SANITY_IMPORT_MAP_URL}index.css`)
      expect(links[1].props.href).toBe(`${VISION_IMPORT_MAP_URL}index.css`)
    })

    test('studio link renders before vision link', () => {
      const root = createRootElement()
      addImportMap({
        'sanity/': SANITY_IMPORT_MAP_URL,
        '@sanity/vision/': VISION_IMPORT_MAP_URL,
      })

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links[0].props.href).toContain('/sanity/')
      expect(links[1].props.href).toContain('/@sanity__vision/')
    })

    test('wraps in Suspense only when at least one fallback is needed', () => {
      const root = createRootElement({studio: true})
      addImportMap({
        'sanity/': SANITY_IMPORT_MAP_URL,
        '@sanity/vision/': VISION_IMPORT_MAP_URL,
      })

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      // Vision fallback exists, so Suspense should be used
      expect(rendered.type).toBe(Symbol.for('react.suspense'))
    })

    test('does not wrap in Suspense when no fallback is needed', () => {
      const root = createRootElement({studio: true, vision: true})
      addImportMap({
        'sanity/': SANITY_IMPORT_MAP_URL,
        '@sanity/vision/': VISION_IMPORT_MAP_URL,
      })

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      expect(rendered.type).not.toBe(Symbol.for('react.suspense'))
    })

    test('only injects studio link when vision CSS is already loaded', () => {
      const root = createRootElement({vision: true})
      addImportMap({
        'sanity/': SANITY_IMPORT_MAP_URL,
        '@sanity/vision/': VISION_IMPORT_MAP_URL,
      })

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(1)
      expect(links[0].props.href).toBe(`${SANITY_IMPORT_MAP_URL}index.css`)
    })
  })
})
