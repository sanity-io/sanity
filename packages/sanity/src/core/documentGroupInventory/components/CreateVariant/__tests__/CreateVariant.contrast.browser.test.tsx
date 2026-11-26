import {configure} from '@chromatic-com/vitest'
import {Card} from '@sanity/ui'
import {of} from 'rxjs'
import {afterAll, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'
import {type ActorRefFromLogic, createActor, fromObservable, setup} from 'xstate'

import {expectStable} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type ReleasesReducerState} from '../../../../releases/store/reducer'
import {ColorSchemeProvider} from '../../../../studio/colorScheme'
import {type VariantStoreState} from '../../../../variants/store/reducer'
import {type SystemVariant} from '../../../../variants/types'
import {variantCreationMachine} from '../../../machines/variantCreationMachine'
import {CreateVariant} from '../CreateVariant'

// The contrast is measured, not archived.
configure({disableAutoSnapshot: true})

/**
 * WCAG 2.x contrast of every text node and glyph of the Create variant form, light and dark, in
 * each state the form shows: empty, a variant chosen, a select hovered and keyboard focused,
 * Cancel and Create hovered and focused, Create disabled. Text needs 4.5:1 (13px is normal text),
 * glyphs and the selects' boundaries need 3:1 (1.4.3 and 1.4.11). The info buttons after the
 * field titles and the line under Start from naming where Nearest version copies from are
 * measured with the rest, and in their own hovered and focused states. A disabled control is exempt;
 * its ratio is reported, not asserted.
 */

const NORDIC: SystemVariant = {
  _id: '_.variants.nordic',
  _type: 'system.variant',
  _rev: 'rev',
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  conditions: {},
  priority: 0,
  metadata: {title: 'Nordic region'},
}

const VARIANTS: VariantStoreState = {
  variants: new Map([[NORDIC._id, NORDIC]]),
  state: 'loaded',
}
const RELEASES: ReleasesReducerState = {releases: new Map(), state: 'loaded'}

/** The form's machine reports to a parent when it opens, so it runs under one. */
function createVariantCreationRef() {
  const parent = createActor(
    setup({
      actors: {
        creation: variantCreationMachine.provide({
          actors: {
            variants: fromObservable(() => of(VARIANTS)),
            releases: fromObservable(() => of(RELEASES)),
          },
        }),
      },
    }).createMachine({invoke: {id: 'creation', src: 'creation', input: {}}}),
  ).start()
  const ref = parent.getSnapshot().children.creation as ActorRefFromLogic<
    typeof variantCreationMachine
  >
  ref.send({type: 'createVariant.request'})
  return ref
}

function Harness({scheme}: {scheme: 'light' | 'dark'}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <ColorSchemeProvider scheme={scheme}>
        {/* The inventory panel the inset card sits on */}
        <Card padding={3}>
          <div style={{width: 360}}>
            <CreateVariant
              variantCreationRef={createVariantCreationRef()}
              sets={[]}
              documentTitle="Summer sale"
            />
          </div>
        </Card>
      </ColorSchemeProvider>
    </TestWrapper>
  )
}

// ---------------------------------------------------------------------------------------------
// Colour maths

type RGBA = [number, number, number, number]

const scratch = document.createElement('canvas').getContext('2d', {willReadFrequently: true})!

/** Any CSS colour Chrome computes (rgb, color(srgb), oklch, ...) as 0-255 RGB and 0-1 alpha. */
function parseColor(value: string): RGBA {
  const rgb = value.match(/^rgba?\(([^)]+)\)$/)
  if (rgb) {
    const [r, g, b, a = '1'] = rgb[1].split(/[\s,/]+/).filter(Boolean)
    return [Number(r), Number(g), Number(b), Number(a)]
  }
  const srgb = value.match(/^color\(srgb ([^)]+)\)$/)
  if (srgb) {
    const [r, g, b, a = '1'] = srgb[1].split(/[\s/]+/).filter(Boolean)
    return [Number(r) * 255, Number(g) * 255, Number(b) * 255, Number(a)]
  }
  scratch.clearRect(0, 0, 1, 1)
  scratch.fillStyle = value
  scratch.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = scratch.getImageData(0, 0, 1, 1).data
  return [r, g, b, a / 255]
}

function over(top: RGBA, bottom: RGBA): RGBA {
  const a = top[3]
  return [
    top[0] * a + bottom[0] * (1 - a),
    top[1] * a + bottom[1] * (1 - a),
    top[2] * a + bottom[2] * (1 - a),
    1,
  ]
}

function mix(inside: RGBA, outside: RGBA, opacity: number): RGBA {
  return [0, 1, 2].map((i) => inside[i] * opacity + outside[i] * (1 - opacity)).concat(1) as RGBA
}

function luminance([r, g, b]: RGBA): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function ratio(a: RGBA, b: RGBA): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const hex = ([r, g, b]: RGBA) =>
  `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`

/**
 * What `color` paints at `element` and the background under it, composited down from the page:
 * each ancestor's background is laid over the one behind it, and an ancestor with `opacity` below
 * 1 blends everything inside it with what is behind it (exact for the opaque surfaces here).
 */
function composite(element: Element, color: string): {fg: RGBA; bg: RGBA} {
  const chain: Element[] = []
  for (let node: Element | null = element; node; node = node.parentElement) chain.unshift(node)
  const scheme = getComputedStyle(document.documentElement).colorScheme
  let behind: RGBA = scheme.includes('dark') ? [18, 18, 18, 1] : [255, 255, 255, 1]
  const groups: {opacity: number; behind: RGBA}[] = []
  for (const node of chain) {
    const style = getComputedStyle(node)
    const opacity = Number(style.opacity)
    if (opacity < 1) groups.push({opacity, behind})
    behind = over(parseColor(style.backgroundColor), behind)
  }
  let fg = over(parseColor(color), behind)
  let bg = behind
  for (const group of groups.reverse()) {
    fg = mix(fg, group.behind, group.opacity)
    bg = mix(bg, group.behind, group.opacity)
  }
  return {fg, bg}
}

// ---------------------------------------------------------------------------------------------
// Measuring

interface Row {
  scheme: string
  state: string
  item: string
  kind: 'text' | 'glyph' | 'boundary' | 'focus ring'
  fg: string
  bg: string
  ratio: number
  min: number
  exempt: boolean
}

const rows: Row[] = []

const form = () => page.getByTestId('create-variant-form').element() as HTMLElement

function isVisible(element: Element) {
  const box = element.getBoundingClientRect()
  return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden'
}

/** A readable name for what a measured node belongs to. */
function nameOf(element: Element): string {
  const owner = element.closest('[data-testid]')
  const testId = owner?.getAttribute('data-testid') ?? ''
  const short = testId.replace(/^create-variant-/, '').replace(/-menu/, '')
  return short || element.tagName.toLowerCase()
}

function isDisabled(element: Element) {
  return Boolean(element.closest('button:disabled, [data-disabled="true"], [aria-disabled="true"]'))
}

function measure(scheme: string, state: string, scope: Element = form()) {
  const measured: Row[] = []
  const record = (row: Omit<Row, 'scheme' | 'state'>) => measured.push({scheme, state, ...row})

  // Text: every element holding a non-blank text node
  for (const element of scope.querySelectorAll('*')) {
    const text = [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent ?? '')
      .join('')
      .trim()
    if (!text || !isVisible(element)) continue
    const {fg, bg} = composite(element, getComputedStyle(element).color)
    record({
      item: `${nameOf(element)} "${text.slice(0, 22)}"`,
      kind: 'text',
      fg: hex(fg),
      bg: hex(bg),
      ratio: ratio(fg, bg),
      min: 4.5,
      exempt: isDisabled(element),
    })
  }

  // Glyphs: the painted stroke or fill of each icon's first visible shape
  for (const svg of scope.querySelectorAll('svg')) {
    if (!isVisible(svg)) continue
    const shape = [...svg.querySelectorAll('path, circle, rect, ellipse, polygon')].find(
      (candidate) => {
        const style = getComputedStyle(candidate)
        return style.stroke !== 'none' || style.fill !== 'none'
      },
    )
    if (!shape) continue
    const style = getComputedStyle(shape)
    const paint = style.stroke !== 'none' ? style.stroke : style.fill
    const {fg, bg} = composite(shape, paint)
    const holder = svg.closest('[data-ui="VariantMark"]') ? 'variant mark' : 'icon'
    // The Drafts dot is the release tone of the shared release avatar, next to the word "Drafts"
    // that names the same thing: it is not required to understand the select (1.4.11 covers
    // graphics that are), so it is reported, not asserted.
    const redundant = Boolean(svg.closest('[data-testid^="release-avatar"]'))
    record({
      item: `${nameOf(svg)} ${holder}`,
      kind: 'glyph',
      fg: hex(fg),
      bg: hex(bg),
      ratio: ratio(fg, bg),
      min: 3,
      exempt: isDisabled(svg) || redundant,
    })
  }

  // Select boundaries (1.4.11): the border against the card, unless the fill itself carries 3:1
  const selector = '[data-testid$="-menu-button"]'
  const selects = [...(scope.matches(selector) ? [scope] : []), ...scope.querySelectorAll(selector)]
  for (const select of selects) {
    const card = composite(form(), 'transparent').bg
    const style = getComputedStyle(select)
    const fill = composite(select, 'transparent').bg
    const fillRatio = ratio(fill, card)
    const borderColor =
      style.borderStyle !== 'none' && parseFloat(style.borderTopWidth) > 0
        ? style.borderTopColor
        : (style.boxShadow.match(/(?:rgba?|color|oklch|oklab)\([^)]*\)/)?.[0] ?? 'transparent')
    const border = over(parseColor(borderColor), card)
    const borderRatio = ratio(border, card)
    record({
      item: `${nameOf(select)} border${fillRatio >= 3 ? ' (fill carries it)' : ''}`,
      kind: 'boundary',
      fg: hex(border),
      bg: hex(card),
      ratio: Math.max(borderRatio, fillRatio),
      min: 3,
      exempt: false,
    })
  }

  rows.push(...measured)
  return measured
}

/**
 * The focus ring of the focused element against the card: the first (topmost) box-shadow colour.
 * `@sanity/ui` draws it as a 1px inset ring over a 2px inset gap in the card's own colour.
 */
function measureFocusRing(scheme: string, state: string) {
  const focused = document.activeElement!
  const shadow = getComputedStyle(focused).boxShadow
  const colors = shadow.match(/(?:rgba?|color|oklch|oklab)\([^)]*\)/g) ?? []
  const card = composite(form(), 'transparent').bg
  const ring = colors[0] ? over(parseColor(colors[0]), card) : card
  const row: Row = {
    scheme,
    state,
    item: `${nameOf(focused)} focus ring`,
    kind: 'focus ring',
    fg: hex(ring),
    bg: hex(card),
    ratio: ratio(ring, card),
    min: 3,
    exempt: false,
  }
  rows.push(row)
  return [row]
}

/** The elements from the root down to `element`, whose opacity and background it is painted on. */
function ancestors(element: Element): Element[] {
  const chain: Element[] = []
  for (let node = element.parentElement; node; node = node.parentElement) chain.push(node)
  return chain
}

/**
 * Waits until what the user sees has stopped changing: no CSS transition or animation is still
 * running on the page, and the colours of `scope` and the opacity of everything it sits in are
 * steady. The harness's pane fades in from `opacity: 0` over 200ms (`PaneLayout`), and Firefox and
 * WebKit can still be part way through that fade when the form first shows, which would dim every
 * colour measured inside it.
 */
async function settle(scope: () => Element = form) {
  await expect
    .poll(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
          .filter((animation) => animation.playState === 'running').length,
      {timeout: 5_000},
    )
    .toBe(0)
  await expectStable(() =>
    [
      ...[...scope().querySelectorAll('*')].map((element) => {
        const style = getComputedStyle(element)
        return `${style.color}|${style.backgroundColor}|${style.boxShadow}|${style.opacity}`
      }),
      ...ancestors(scope()).map((element) => getComputedStyle(element).opacity),
    ].join(';'),
  )
}

function expectPasses(measured: Row[]) {
  const failures = measured.filter((row) => !row.exempt && row.ratio < row.min)
  expect(failures.map((row) => `${row.item}: ${row.ratio.toFixed(2)}:1 < ${row.min}:1`)).toEqual([])
}

afterAll(() => {
  const table = rows.map((row) => ({
    scheme: row.scheme,
    state: row.state,
    item: row.item,
    kind: row.kind,
    fg: row.fg,
    bg: row.bg,
    ratio: Number(row.ratio.toFixed(2)),
    min: row.min,
    result: row.exempt ? 'exempt' : row.ratio >= row.min ? 'pass' : 'FAIL',
  }))
  // oxlint-disable-next-line no-console -- the contrast table is the report of this test
  console.log(
    `\nCreate variant form contrast\n${table
      .map((r) =>
        [r.scheme, r.state, r.item, r.kind, r.fg, r.bg, `${r.ratio}:1`, `${r.min}`, r.result].join(
          ' | ',
        ),
      )
      .join('\n')}`,
  )
})

describe.each(['light', 'dark'] as const)('Create variant form contrast (%s)', (scheme) => {
  const variantSelect = () => page.getByTestId('create-variant-variant-menu-button')
  const cancel = () => page.getByTestId('create-variant-cancel')
  const create = () => page.getByTestId('create-variant-confirm')

  async function open() {
    void render(<Harness scheme={scheme} />)
    await expect.element(page.getByTestId('create-variant-form')).toBeVisible()
    await expect.element(page.getByText('Choose who sees it')).toBeVisible()
    await settle()
  }

  async function chooseVariant() {
    await variantSelect().click()
    await page.getByRole('menuitemradio', {name: 'Nordic region'}).click()
    await expect
      .element(page.getByTestId('create-variant-variant-menu-value'))
      .toHaveTextContent('Nordic region')
    await expect.element(create()).toBeEnabled()
  }

  it('empty: every text and glyph, the selects and the disabled Create button', async () => {
    await open()
    await expect.element(create()).toBeDisabled()
    expectPasses(measure(scheme, 'empty'))
  })

  it('a variant chosen', async () => {
    await open()
    await chooseVariant()
    await userEvent.unhover(variantSelect())
    await settle()
    expectPasses(measure(scheme, 'chosen'))
  })

  it('a select hovered', async () => {
    await open()
    // Add to, which does not hold the focus the form gives Variant when it opens
    const targetSelect = page.getByTestId('create-variant-target-menu-button')
    await userEvent.hover(targetSelect)
    await settle()
    expectPasses(measure(scheme, 'select hover', targetSelect.element()))
  })

  it('a select focused from the keyboard', async () => {
    await open()
    // Off the select and back with the keyboard, so it shows its keyboard focus
    ;(document.activeElement as HTMLElement | null)?.blur()
    await userEvent.click(page.getByTestId('create-variant-header'))
    // The Variant info button, then the select
    await userEvent.keyboard('{Tab}')
    await expect.element(page.getByTestId('create-variant-variant-menu-info')).toHaveFocus()
    await userEvent.keyboard('{Tab}')
    await expect.element(variantSelect()).toHaveFocus()
    await settle()
    expectPasses([
      ...measure(scheme, 'select focus', variantSelect().element()),
      ...measureFocusRing(scheme, 'select focus'),
    ])
  })

  it('the info buttons and the Start from source line', async () => {
    await open()
    const infoIds = ['variant', 'target', 'base'].map(
      (field) => `create-variant-${field}-menu-info`,
    )
    const line = page.getByTestId('create-variant-base-menu-description')
    await expect.element(line).toHaveTextContent('Starts empty')

    // At rest: each info glyph (3:1) and the source line (4.5:1)
    const rest = measure(scheme, 'info at rest')
    for (const id of infoIds) {
      expect(
        rest.some(
          (row) => row.item === `${id.replace(/^create-variant-/, '').replace(/-menu/, '')} icon`,
        ),
      ).toBe(true)
    }
    expect(rest.some((row) => row.kind === 'text' && row.item.includes('Starts empty'))).toBe(true)

    // Hovered and keyboard focused: the glyph and the focus ring
    const info = page.getByTestId('create-variant-base-menu-info')
    await userEvent.hover(info)
    await settle()
    const hovered = measure(scheme, 'info hover', info.element())
    expect(hovered).toHaveLength(1)

    await userEvent.unhover(info)
    ;(document.activeElement as HTMLElement | null)?.blur()
    await userEvent.click(page.getByTestId('create-variant-header'))
    await userEvent.keyboard('{Tab}')
    const variantInfo = page.getByTestId('create-variant-variant-menu-info')
    await expect.element(variantInfo).toHaveFocus()
    await settle()
    const focused = [
      ...measure(scheme, 'info focus', variantInfo.element()),
      ...measureFocusRing(scheme, 'info focus'),
    ]

    expectPasses([...rest, ...hovered, ...focused])
  })

  it('Cancel and Create hovered and focused', async () => {
    await open()
    await chooseVariant()

    await userEvent.hover(cancel())
    await settle()
    const cancelHover = measure(scheme, 'cancel hover', cancel().element())

    await userEvent.hover(create())
    await settle()
    const createHover = measure(scheme, 'create hover', create().element())

    await userEvent.unhover(create())
    create().element().focus()
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    await expect.element(cancel()).toHaveFocus()
    await settle()
    const cancelFocus = [
      ...measure(scheme, 'cancel focus', cancel().element()),
      ...measureFocusRing(scheme, 'cancel focus'),
    ]

    await userEvent.keyboard('{Tab}')
    await expect.element(create()).toHaveFocus()
    await settle()
    const createFocus = [
      ...measure(scheme, 'create focus', create().element()),
      ...measureFocusRing(scheme, 'create focus'),
    ]

    expectPasses([...cancelHover, ...createHover, ...cancelFocus, ...createFocus])
  })
})
