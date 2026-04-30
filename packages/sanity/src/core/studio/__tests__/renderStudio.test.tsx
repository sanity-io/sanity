import {type ReactElement} from 'react'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

// Mock react-dom/client to capture what's rendered without actually mounting
const mockRender = vi.fn()
const mockUnmount = vi.fn()
vi.mock('react-dom/client', () => ({
  createRoot: () => ({render: mockRender, unmount: mockUnmount}),
}))

import {renderStudio, _resetImportmapCache} from '../renderStudio'

const SANITY_IMPORT_MAP_URL =
  'https://sanity-cdn.com/v1/modules/by-app/kp75luobnkn8sgzxcjran97e/t1777546669/%5E5.23.0/sanity/'
const VISION_IMPORT_MAP_URL =
  'https://sanity-cdn.com/v1/modules/by-app/kp75luobnkn8sgzxcjran97e/t1777546669/%5E5.23.0/@sanity__vision/'

/**
 * A realistic import map based on actual production studios, containing vendor
 * entries alongside the CDN module entries for sanity and @sanity/vision.
 */
const REALISTIC_IMPORT_MAP: Record<string, string> = {
  'react': '/vendor/react/index-CijJRqun.mjs',
  'react/compiler-runtime': '/vendor/react/compiler-runtime-DFvlMPQC.mjs',
  'react/jsx-dev-runtime': '/vendor/react/jsx-dev-runtime-DYLplPiq.mjs',
  'react/jsx-runtime': '/vendor/react/jsx-runtime-CInpRuN4.mjs',
  'react/package.json': '/vendor/react/package.json-C9u_SLlD.mjs',
  'react-dom': '/vendor/react-dom/index-Dc2VsVq7.mjs',
  'react-dom/client': '/vendor/react-dom/client-BTifGfEX.mjs',
  'react-dom/package.json': '/vendor/react-dom/package.json-DJr-B_rE.mjs',
  'react-dom/server': '/vendor/react-dom/server-BsxsyesJ.mjs',
  'react-dom/static': '/vendor/react-dom/static-B4c9UOBd.mjs',
  'styled-components': '/vendor/styled-components/index-BMkpm8Xj.mjs',
  'styled-components/package.json': '/vendor/styled-components/package.json-DqoIBjAO.mjs',
  'react-dom/server.browser': '/vendor/react-dom/server.browser-aA8Xdow4.mjs',
  'react-dom/static.browser': '/vendor/react-dom/static.browser-B1q7wT8N.mjs',
  'sanity': 'https://sanity-cdn.com/v1/modules/by-app/kp75luobnkn8sgzxcjran97e/t1777546669/%5E5.23.0/sanity',
  'sanity/': SANITY_IMPORT_MAP_URL,
  '@sanity/vision': 'https://sanity-cdn.com/v1/modules/by-app/kp75luobnkn8sgzxcjran97e/t1777546669/%5E5.23.0/@sanity__vision',
  '@sanity/vision/': VISION_IMPORT_MAP_URL,
}

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
    _resetImportmapCache()
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
      addImportMap(REALISTIC_IMPORT_MAP)

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(1)
      expect(links[0].props.rel).toBe('stylesheet')
      expect(links[0].props.href).toBe(`${SANITY_IMPORT_MAP_URL}bundle.css`)
      expect(links[0].props.precedence).toBe('sanity')
    })

    test('does not inject when --static-css-file-loaded-studio is set', () => {
      const root = createRootElement({studio: true, vision: true})
      addImportMap(REALISTIC_IMPORT_MAP)

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
      addImportMap(REALISTIC_IMPORT_MAP)

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(1)
      expect(links[0].props.rel).toBe('stylesheet')
      expect(links[0].props.href).toBe(`${VISION_IMPORT_MAP_URL}bundle.css`)
      expect(links[0].props.precedence).toBe('sanity')
    })

    test('does not inject when --static-css-file-loaded-vision is set', () => {
      const root = createRootElement({studio: true, vision: true})
      addImportMap(REALISTIC_IMPORT_MAP)

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
      addImportMap(REALISTIC_IMPORT_MAP)

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(2)
      expect(links[0].props.href).toBe(`${SANITY_IMPORT_MAP_URL}bundle.css`)
      expect(links[1].props.href).toBe(`${VISION_IMPORT_MAP_URL}bundle.css`)
    })

    test('studio link renders before vision link', () => {
      const root = createRootElement()
      addImportMap(REALISTIC_IMPORT_MAP)

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links[0].props.href).toContain('/sanity/')
      expect(links[1].props.href).toContain('/@sanity__vision/')
    })

    test('wraps in Suspense only when at least one fallback is needed', () => {
      const root = createRootElement({studio: true})
      addImportMap(REALISTIC_IMPORT_MAP)

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      // Vision fallback exists, so Suspense should be used
      expect(rendered.type).toBe(Symbol.for('react.suspense'))
    })

    test('does not wrap in Suspense when no fallback is needed', () => {
      const root = createRootElement({studio: true, vision: true})
      addImportMap(REALISTIC_IMPORT_MAP)

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      expect(rendered.type).not.toBe(Symbol.for('react.suspense'))
    })

    test('only injects studio link when vision CSS is already loaded', () => {
      const root = createRootElement({vision: true})
      addImportMap(REALISTIC_IMPORT_MAP)

      renderStudio(root, {} as any)

      const rendered = mockRender.mock.calls[0][0] as ReactElement
      const links = findLinksInTree(rendered)
      expect(links).toHaveLength(1)
      expect(links[0].props.href).toBe(`${SANITY_IMPORT_MAP_URL}bundle.css`)
    })
  })
})
