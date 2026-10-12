import vm from 'node:vm'

import {describe, expect, test} from 'vitest'

import {
  buildDomPropLeakScannerScript,
  DOM_PROP_LEAK_MARKER,
  type DomPropLeakFinding,
  type DomPropLeakScan,
} from './scanner'
import {loadDomPropVocabulary} from './vocabulary'

const PROPS_KEY = '__reactProps$test'
const FIBER_KEY = '__reactFiber$test'

class FakeElement {
  readonly nodeType = 1
  readonly namespaceURI = 'http://www.w3.org/1999/xhtml'
  readonly attributes: {name: string; value: string}[]
  readonly childElements: FakeElement[] = []

  constructor(
    readonly localName: string,
    attributes: Record<string, string> = {},
  ) {
    this.attributes = Object.entries(attributes).map(([name, value]) => ({name, value}))
  }

  get offsetParent(): FakeElement | null {
    return null
  }

  get firstElementChild(): FakeElement | null {
    return this.childElements[0] ?? null
  }

  getAttribute(name: string): string | null {
    return this.attributes.find((attribute) => attribute.name === name)?.value ?? null
  }

  hasAttribute(name: string): boolean {
    return this.getAttribute(name) !== null
  }

  setAttribute(name: string, value: string): void {
    const attribute = this.attributes.find((existing) => existing.name === name)
    if (attribute) attribute.value = value
    else this.attributes.push({name, value})
  }

  append(...children: FakeElement[]): this {
    this.childElements.push(...children)
    return this
  }

  getElementsByTagName(): FakeElement[] {
    return this.childElements.flatMap((child) => [child, ...child.getElementsByTagName()])
  }
}

// `attributionsrc`, `ping` and `text` are in neither React's attribute table nor
// @emotion/is-prop-valid.
class FakeImageElement extends FakeElement {
  get attributionSrc(): string {
    return this.getAttribute('attributionsrc') ?? ''
  }

  set attributionSrc(value: string) {
    this.setAttribute('attributionsrc', value)
  }
}

class FakeAnchorElement extends FakeElement {
  textContent = ''

  get ping(): string {
    return this.getAttribute('ping') ?? ''
  }

  set ping(value: string) {
    this.setAttribute('ping', value)
  }

  get text(): string {
    return this.textContent
  }

  set text(value: string) {
    this.textContent = value
  }
}

const ELEMENTS: Record<string, typeof FakeElement> = {a: FakeAnchorElement, img: FakeImageElement}

interface FakeFiber {
  tag: number
  type: unknown
  elementType: unknown
  return: FakeFiber | null
}

function componentFiber(tag: number, type: unknown, parent: FakeFiber | null): FakeFiber {
  return {tag, type, elementType: type, return: parent}
}

function render<Rendered extends FakeElement>(
  element: Rendered,
  props: Record<string, unknown>,
  parent: FakeFiber | null,
): Rendered {
  Object.assign(element, {
    [PROPS_KEY]: props,
    [FIBER_KEY]: {tag: 5, type: element.localName, elementType: element.localName, return: parent},
  })
  return element
}

function setProps(element: FakeElement, props: Record<string, unknown>): void {
  Object.assign(element, {[PROPS_KEY]: props})
}

function StructureTool() {}
function IntentLink() {}
const styledCard = {styledComponentId: 'sc-card', displayName: 'StyledCard', render() {}}
const structureToolFiber = componentFiber(0, StructureTool, null)
const intentLinkFiber = componentFiber(0, IntentLink, structureToolFiber)
const styledCardFiber = componentFiber(11, styledCard, intentLinkFiber)

function createDocument() {
  const html = new FakeElement('html')
  const studioRoot = new FakeElement('div', {id: 'sanity'})
  html.append(studioRoot)

  let clock = 0
  let notify: ((records: unknown[]) => void) | undefined
  const logs: string[] = []
  const listeners = new Map<string, () => void>()
  const global: Record<string, unknown> = {
    console: {debug: (message: string) => logs.push(message)},
    performance: {now: () => clock},
    location: {href: 'http://localhost:3339/test/structure'},
    Node: {ELEMENT_NODE: 1},
    document: {
      documentElement: html,
      getElementById: (id: string) =>
        html
          .getElementsByTagName()
          .find((element) =>
            element.attributes.some(
              (attribute) => attribute.name === 'id' && attribute.value === id,
            ),
          ) ?? null,
      implementation: {
        createHTMLDocument: () => ({
          createElementNS: (_namespace: string | null, localName: string) =>
            new (ELEMENTS[localName] ?? FakeElement)(localName),
        }),
      },
    },
    MutationObserver: class {
      constructor(callback: (records: unknown[]) => void) {
        notify = callback
      }
      observe() {}
      takeRecords() {
        return []
      }
    },
    addEventListener: (type: string, listener: () => void) => listeners.set(type, listener),
  }
  global.window = global
  vm.createContext(global)
  const script = buildDomPropLeakScannerScript(loadDomPropVocabulary())
  vm.runInContext(script, global)

  return {
    studioRoot,
    reinstall: () => vm.runInContext(script, global),
    scanner: () => global.__sanityDomPropLeakScanner as {scan: () => DomPropLeakScan},
    scan: () => (global.__sanityDomPropLeakScanner as {scan: () => DomPropLeakScan}).scan(),
    add(...elements: FakeElement[]) {
      studioRoot.append(...elements)
      notify!([{type: 'childList', target: studioRoot, addedNodes: elements}])
    },
    changeAttribute(element: FakeElement, attributeName: string) {
      notify!([{type: 'attributes', target: element, attributeName, addedNodes: []}])
    },
    advanceClock(milliseconds: number) {
      clock += milliseconds
    },
    hidePage: () => listeners.get('pagehide')!(),
    logged: (): DomPropLeakFinding[] =>
      logs
        .filter((message) => message.startsWith(DOM_PROP_LEAK_MARKER))
        .map((message) => JSON.parse(message.slice(DOM_PROP_LEAK_MARKER.length))),
  }
}

describe('DOM prop leak scanner', () => {
  test('reports leaked props of added elements with the components that rendered them', () => {
    const page = createDocument()
    const link = render(
      new FakeElement('a', {href: '/test/intent/edit/id=a', class: 'sc-card'}),
      {href: '/test/intent/edit/id=a', intent: 'edit', isOpen: true, children: 'Open'},
      styledCardFiber,
    )
    page.add(link)

    const url = 'http://localhost:3339/test/structure'
    const element = '<a href="/test/intent/edit/id=a" class="sc-card">'
    const components = ['StructureTool', 'IntentLink', 'StyledCard']
    expect(page.logged()).toEqual([
      {
        rule: 'styled-components',
        prop: 'intent',
        message: expect.stringContaining('unknown prop "intent" is being sent through to the DOM'),
        tag: 'a',
        components,
        element,
        url,
      },
      {
        rule: 'react',
        prop: 'isOpen',
        message: expect.stringMatching(
          /^React does not recognize the `isOpen` prop on a DOM element/,
        ),
        tag: 'a',
        components,
        element,
        url,
      },
    ])
    expect(page.scan().findings).toEqual(page.logged())
  })

  test('accepts the attributes an element reflects, and flags the names it does not', () => {
    const page = createDocument()
    const image = render(
      new FakeImageElement('img'),
      {src: '/a.png', attributionsrc: 'https://example.com/register', tone: 'primary'},
      intentLinkFiber,
    )
    const linkAttributes = {href: '/a', ping: '/track', text: 'Open'}
    const link = render(new FakeAnchorElement('a', linkAttributes), linkAttributes, intentLinkFiber)
    const card = render(
      new FakeElement('div', {offsetparent: 'card'}),
      {offsetparent: 'card'},
      intentLinkFiber,
    )
    page.add(render(new FakeElement('div'), {}, structureToolFiber).append(image, link, card))

    // Having a property of that name is not enough: setting `text` changes the link's text, and
    // `offsetParent` cannot be set.
    expect(page.logged()).toEqual([
      expect.objectContaining({rule: 'unknown-attribute', prop: 'tone', tag: 'img'}),
      expect.objectContaining({rule: 'unknown-attribute', prop: 'text', tag: 'a'}),
      expect.objectContaining({rule: 'unknown-attribute', prop: 'offsetparent', tag: 'div'}),
    ])
    // The properties are tried on elements the scanner creates, never on the page's.
    expect(link.attributes).toEqual(
      Object.entries(linkAttributes).map(([name, value]) => ({name, value})),
    )
    expect(link.text).toBe('')
  })

  test('checks props React updates without changing the DOM', () => {
    const page = createDocument()
    const button = render(new FakeElement('button'), {type: 'button'}, intentLinkFiber)
    const other = render(new FakeElement('span'), {}, intentLinkFiber)
    page.add(button, other)
    expect(page.logged()).toEqual([])

    setProps(button, {type: 'button', disableTransition: true})
    page.changeAttribute(other, 'class')
    expect(page.logged()).toEqual([])

    // The whole document is rescanned once the DOM changes after the rescan interval.
    page.advanceClock(1000)
    page.changeAttribute(other, 'class')
    expect(page.logged()).toEqual([
      expect.objectContaining({rule: 'react', prop: 'disableTransition', tag: 'button'}),
    ])
  })

  test('rechecks an element when one of its attributes changes', () => {
    const page = createDocument()
    const card = render(new FakeElement('div'), {}, styledCardFiber)
    page.add(card)
    page.advanceClock(10)

    setProps(card, {selected: true, tone: 'primary'})
    page.changeAttribute(card, 'data-selected')
    expect(page.logged()).toEqual([
      expect.objectContaining({rule: 'styled-components', prop: 'tone', tag: 'div'}),
    ])

    // Style changes are the most frequent mutation, and props do not change with them.
    setProps(card, {radius: 2})
    page.changeAttribute(card, 'style')
    expect(page.logged()).toHaveLength(1)
  })

  test('scans the whole document when the page is hidden', () => {
    const page = createDocument()
    const input = render(new FakeElement('input'), {value: 'a'}, intentLinkFiber)
    page.add(input)
    setProps(input, {value: 'a', validation: {markers: []}})

    page.hidePage()
    expect(page.logged()).toEqual([
      expect.objectContaining({rule: 'object-value', prop: 'validation', tag: 'input'}),
    ])
  })

  test('reports each leak once per component chain, and ignores elements React did not render', () => {
    const page = createDocument()
    page.add(
      render(new FakeElement('div'), {intent: 'edit'}, intentLinkFiber),
      render(new FakeElement('div'), {intent: 'edit'}, intentLinkFiber),
      render(new FakeElement('div'), {intent: 'edit'}, structureToolFiber),
      new FakeElement('div', {intent: 'edit'}),
    )

    const scan = page.scan()
    expect(scan.findings.map((finding) => finding.components)).toEqual([
      ['StructureTool', 'IntentLink'],
      ['StructureTool'],
    ])
    expect(scan.stats.reactElements).toBe(3)
    expect(scan.studioRendered).toBe(true)
    expect(scan.error).toBeNull()
  })

  test('names memo and forwardRef components the way React DevTools does', () => {
    const page = createDocument()
    function DocumentPane() {}
    function PaneItem() {}
    const memoFiber = componentFiber(14, {type: DocumentPane}, null)
    const forwardRefFiber = componentFiber(11, {render: PaneItem}, memoFiber)
    const namedFiber = componentFiber(15, {displayName: 'Named'}, forwardRefFiber)
    page.add(render(new FakeElement('div'), {intent: 'edit'}, namedFiber))

    expect(page.scan().findings[0].components).toEqual(['DocumentPane', 'PaneItem', 'Named'])
  })

  test('names components as the source does, without the suffix of a bundler rename', () => {
    const page = createDocument()
    function Tooltip() {}
    const renamedTooltip = Object.defineProperty(() => {}, 'name', {value: 'Tooltip$1'})
    const renamedButton = {displayName: 'Button$12', render() {}}
    const outerTooltipFiber = componentFiber(0, renamedTooltip, null)
    const tooltipFiber = componentFiber(0, Tooltip, outerTooltipFiber)
    const buttonFiber = componentFiber(11, renamedButton, tooltipFiber)
    page.add(render(new FakeElement('div'), {intent: 'edit'}, buttonFiber))

    expect(page.scan().findings[0].components).toEqual(['Tooltip', 'Button'])
  })

  test('stops, and says why, when it throws', () => {
    const page = createDocument()
    const props = {}
    Object.defineProperty(props, 'broken', {
      enumerable: true,
      get() {
        throw new Error('props getter threw')
      },
    })
    page.add(render(new FakeElement('div'), props, null))

    expect(page.scan().error).toContain('props getter threw')
  })

  test('is installed once per document', () => {
    const page = createDocument()
    const scanner = page.scanner()
    page.reinstall()
    expect(page.scanner()).toBe(scanner)
  })

  test('says when the studio has not rendered yet', () => {
    const page = createDocument()
    expect(page.scan()).toMatchObject({studioRendered: false, findings: [], error: null})
  })
})
