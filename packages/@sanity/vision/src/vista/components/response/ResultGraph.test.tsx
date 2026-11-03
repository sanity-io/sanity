import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {act, cleanup, fireEvent, render, screen, within} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type ResultViewCopy} from '../../../components/ResultView'
import {ResultGraph} from './ResultGraph'

vi.mock('sanity', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}))

// The viewport is 800×600 wherever the tests run
vi.mock('../../hooks/useContentSize', () => ({useContentSize: () => ({width: 800, height: 600})}))

vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

const theme = buildTheme()

const result = [
  {_id: 'a', name: 'Ada', author: {name: 'Bea', tags: ['x', 'y']}},
  {_id: 'b', name: 'Cy'},
]

function renderGraph(value: unknown = result) {
  const copy: ResultViewCopy = {label: 'Copy value', onCopy: vi.fn()}
  render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <ResultGraph copy={copy} id="vista-result-content" value={value} />
      </LayerProvider>
    </ThemeProvider>,
  )
  return {copy}
}

const nodes = () => screen.getAllByTestId('vista-graph-node')
const nodeAt = (keypath: string) =>
  nodes().find((node) => node.getAttribute('data-keypath') === keypath) as HTMLElement
const transform = () => screen.getByTestId('vista-graph-canvas').style.transform
const scale = () => Number(/scale\(([\d.]+)\)/.exec(transform())?.[1])
const translate = () =>
  (/translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(transform()) ?? []).slice(1).map(Number)

describe('ResultGraph', () => {
  afterEach(() => cleanup())

  it('draws a node for every object and array, its values and an edge to each nested one', () => {
    renderGraph()
    expect(nodes().map((node) => node.getAttribute('data-keypath'))).toEqual([
      '',
      '0',
      '0.author',
      '0.author.tags',
      '1',
    ])
    expect(within(nodeAt('0')).getByText('"Ada"')).toBeTruthy()
    expect(within(nodeAt('0')).getByText('{2}', {selector: '[data-type="child"]'})).toBeTruthy()
    expect(within(nodeAt('0.author.tags')).getByText('"y"')).toBeTruthy()
    expect(screen.getByTestId('vista-graph-edges').querySelectorAll('path')).toHaveLength(4)
  })

  it('hides what a node holds and shows it again', () => {
    renderGraph()
    const toggle = within(nodeAt('0')).getByTestId('vista-graph-toggle')
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(toggle)
    expect(nodes().map((node) => node.getAttribute('data-keypath'))).toEqual(['', '0', '1'])
    expect(within(nodeAt('0')).getByTestId('vista-graph-toggle').getAttribute('aria-label')).toBe(
      'vista.result.graph.expand:{"count":1}',
    )
    fireEvent.click(within(nodeAt('0')).getByTestId('vista-graph-toggle'))
    expect(nodes()).toHaveLength(5)
  })

  it('copies the value a node stands for, with its key path', () => {
    const {copy} = renderGraph()
    fireEvent.click(within(nodeAt('0.author')).getByTestId('vista-graph-copy'))
    expect(copy.onCopy).toHaveBeenCalledWith({name: 'Bea', tags: ['x', 'y']}, '0.author')
  })

  it('zooms with the buttons, the wheel and the keyboard, and fits the graph', () => {
    renderGraph()
    // A small result fits the viewport at its own size
    const first = scale()
    expect(first).toBe(1)
    fireEvent.click(screen.getByTestId('vista-graph-zoom-in'))
    expect(scale()).toBeCloseTo(1.25)
    fireEvent.click(screen.getByTestId('vista-graph-zoom-out'))
    fireEvent.click(screen.getByTestId('vista-graph-zoom-out'))
    expect(scale()).toBeCloseTo(0.8)

    const viewport = screen.getByTestId('vista-result-graph')
    const wheel = new WheelEvent('wheel', {deltaY: -200, clientX: 0, clientY: 0, cancelable: true})
    act(() => {
      viewport.dispatchEvent(wheel)
    })
    expect(wheel.defaultPrevented).toBe(true)
    expect(scale()).toBeGreaterThan(0.8)

    fireEvent.keyDown(viewport, {key: '-'})
    fireEvent.keyDown(viewport, {key: '0'})
    expect(scale()).toBe(1)
    const [x] = translate()
    fireEvent.keyDown(viewport, {key: 'ArrowRight'})
    expect(translate()[0]).toBe(x - 48)
  })

  it('glides to the view the zoom and fit buttons pick, and follows direct input at once', () => {
    renderGraph()
    const canvas = () => screen.getByTestId('vista-graph-canvas')
    const viewport = screen.getByTestId('vista-result-graph')
    expect(canvas().getAttribute('data-animate')).toBe('false')

    fireEvent.click(screen.getByTestId('vista-graph-zoom-in'))
    expect(canvas().getAttribute('data-animate')).toBe('true')
    fireEvent.keyDown(viewport, {key: '+'})
    expect(canvas().getAttribute('data-animate')).toBe('false')
    fireEvent.click(screen.getByTestId('vista-graph-fit'))
    expect(canvas().getAttribute('data-animate')).toBe('true')
    fireEvent.pointerDown(viewport, {pointerId: 1, button: 0, clientX: 100, clientY: 100})
    fireEvent.pointerMove(viewport, {pointerId: 1, clientX: 120, clientY: 100})
    expect(canvas().getAttribute('data-animate')).toBe('false')
  })

  it('pans while its background is dragged', () => {
    renderGraph()
    const viewport = screen.getByTestId('vista-result-graph')
    const [x, y] = translate()
    fireEvent.pointerDown(viewport, {pointerId: 1, button: 0, clientX: 100, clientY: 100})
    fireEvent.pointerMove(viewport, {pointerId: 1, clientX: 160, clientY: 90})
    expect(translate()).toEqual([x + 60, y - 10])
    expect(viewport.getAttribute('data-dragging')).toBe('true')
    fireEvent.pointerUp(viewport, {pointerId: 1})
    fireEvent.pointerMove(viewport, {pointerId: 1, clientX: 300, clientY: 300})
    expect(translate()).toEqual([x + 60, y - 10])
  })

  it('says what it leaves out of this result, and only when it does', () => {
    const leftOut = () => screen.getByTestId('vista-graph-left-out').textContent ?? ''
    // A long array lists its first entries, and the note names it with its length
    renderGraph(Array.from({length: 400}, (_, index) => ({index})))
    expect(leftOut()).toMatch(/^vista\.result\.graph\.partial:\{"rows":30,/)
    expect(leftOut()).toContain('vista.result.graph.root')
    expect(leftOut()).toContain('400')
    expect(leftOut()).not.toContain('vista.result.graph.node-limit')
    expect(leftOut()).toMatch(/vista\.result\.graph\.left-out-hint$/)
    expect(nodes()).toHaveLength(31)
    cleanup()

    // Many nested objects reach the node cap, while no object or array is too long to list
    renderGraph(
      Array.from({length: 20}, (_, item) =>
        Object.fromEntries(Array.from({length: 20}, (_, key) => [`k${key}`, {item, key}])),
      ),
    )
    expect(leftOut()).toBe(
      'vista.result.graph.node-limit:{"nodes":300} vista.result.graph.left-out-hint',
    )
    expect(nodes()).toHaveLength(300)
    cleanup()

    // Several long arrays: the first ones by their path, the others counted
    renderGraph(
      Object.fromEntries(
        Array.from({length: 5}, (_, list) => [`list${list}`, Array.from({length: 31}, () => 1)]),
      ),
    )
    expect(leftOut()).toContain('list0')
    expect(leftOut()).toContain('list2')
    expect(leftOut()).not.toContain('list3')
    expect(leftOut()).toContain('vista.result.graph.partial.more:{\\"count\\":2}')
    cleanup()

    renderGraph()
    expect(screen.queryByTestId('vista-graph-left-out')).toBeNull()
  })
})
