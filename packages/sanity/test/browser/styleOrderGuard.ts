import {page} from 'vitest/browser'

const PSEUDO_ELEMENTS = [undefined, '::before', '::after']
const MAX_REPORTED_ELEMENTS = 20
const MAX_ATTEMPTS = 3

/**
 * Resolved box geometry. A rule that loses the tie-break moves every box
 * around it too, so these are listed only when nothing else changed; the rule
 * itself shows up in some other property.
 */
const GEOMETRY_PROPERTIES = new Set([
  'block-size',
  'inline-size',
  'height',
  'width',
  'top',
  'right',
  'bottom',
  'left',
  'inset-block-start',
  'inset-block-end',
  'inset-inline-start',
  'inset-inline-end',
  'grid-template-columns',
  'grid-template-rows',
  'perspective-origin',
  'transform-origin',
])

/**
 * PNG of the rendered tree as base64 (`save: false` returns it instead of
 * writing a file). `animations` and `caret` are Playwright options the
 * provider forwards, the same ones Vitest's `toMatchScreenshot` sets: a
 * caret blink, or a transition that the stylesheet move itself triggers,
 * must not read as a difference.
 */
function capture(): Promise<string> {
  return page.screenshot({save: false, animations: 'disabled', caret: 'hide'})
}

/**
 * Run `fn` with the styled-components `<style>` element(s) ahead of every
 * other stylesheet, by moving the others behind them: the same cascade as
 * moving them to `head.firstChild`, which is not possible. styled-components
 * inserts its rules through the CSSOM (speedy mode: `process` is undefined in
 * the browser), and re-inserting the element — `prepend` and `moveBefore`
 * alike — gives it a new, empty sheet while styled-components keeps writing
 * to the detached one. The static stylesheets are Vite-injected `<style>`
 * elements whose text is re-parsed where they land, so those can move; one
 * without text is CSSOM-managed too and stays. Everything is put back before
 * returning.
 */
async function withStyledComponentsFirst<T>(
  styledTags: HTMLStyleElement[],
  fn: () => T | Promise<T>,
): Promise<T> {
  const head = window.document.head
  const statics = Array.from(
    head.querySelectorAll<HTMLStyleElement>('style:not([data-styled])'),
  ).filter((tag) => tag.textContent)
  const nextSiblings = statics.map((tag) => tag.nextSibling)
  styledTags[styledTags.length - 1].after(...statics)
  try {
    return await fn()
  } finally {
    // Later tags first, so that a tag whose recorded next sibling is another
    // moved tag is put back after that one is in place.
    for (let i = statics.length - 1; i >= 0; i--) {
      head.insertBefore(statics[i], nextSiblings[i])
    }
  }
}

/**
 * Every standard property of every element (and of its `::before` /
 * `::after`, where it has one), serialized. Custom properties are skipped:
 * the hundreds of theme variables inherited by every element are what makes
 * the walk slow, and a change in one shows up in the property that uses it.
 */
function readComputedStyles(elements: Element[]): string[] {
  const properties = Array.from(window.getComputedStyle(window.document.body)).filter(
    (property) => !property.startsWith('--'),
  )
  return elements.flatMap((element) =>
    PSEUDO_ELEMENTS.map((pseudo) => {
      const style = window.getComputedStyle(element, pseudo)
      if (pseudo && style.content === 'none') return ''
      let serialized = ''
      for (const property of properties) {
        serialized += `${property}:${style.getPropertyValue(property)};`
      }
      return serialized
    }),
  )
}

function describeElement(element: Element, pseudo: string | undefined): string {
  const classes = Array.from(element.classList, (name) => `.${name}`).join('')
  const hooks = ['data-testid', 'data-ui']
    .map((attribute) => {
      const value = element.getAttribute(attribute)
      return value === null ? '' : `[${attribute}="${value}"]`
    })
    .join('')
  return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${classes}${hooks}${pseudo ?? ''}`
}

interface Change {
  property: string
  line: string
}

const isGeometry = (change: Change): boolean => GEOMETRY_PROPERTIES.has(change.property)

function formatStyleDiff(elements: Element[], before: string[], after: string[]): string {
  const changed: {label: string; changes: Change[]}[] = []
  for (let i = 0; i < before.length; i++) {
    if (before[i] === after[i]) continue
    const was = before[i].split(';')
    const changes = after[i].split(';').flatMap((declaration, j): Change[] => {
      if (declaration === was[j]) return []
      const property = declaration.slice(0, declaration.indexOf(':'))
      const value = declaration.slice(property.length + 1)
      return [{property, line: `    ${was[j] ?? `${property}:none`} → ${value}`}]
    })
    const element = elements[Math.floor(i / PSEUDO_ELEMENTS.length)]
    const pseudo = PSEUDO_ELEMENTS[i % PSEUDO_ELEMENTS.length]
    changed.push({label: describeElement(element, pseudo), changes})
  }
  const causes = changed.filter((entry) => !entry.changes.every(isGeometry))
  const reported =
    causes.length > 0
      ? causes.map((entry) => ({...entry, changes: entry.changes.filter((c) => !isGeometry(c))}))
      : changed
  const shown = reported
    .slice(0, MAX_REPORTED_ELEMENTS)
    .map((entry) => [`  ${entry.label}`, ...entry.changes.map((change) => change.line)].join('\n'))
  if (reported.length > shown.length) {
    shown.push(`  …and ${reported.length - shown.length} more`)
  }
  return shown.join('\n')
}

/**
 * Screenshot the page with the stylesheets as they are and with the
 * styled-components rules moved first. `'same'` when the two match,
 * `'unstable'` when the page does not reproduce its first screenshot once the
 * order is restored (something is still changing on its own, so the
 * difference cannot be attributed to the order), otherwise the computed-style
 * diff of the confirmed difference.
 */
async function compareOnce(
  styledTags: HTMLStyleElement[],
): Promise<'same' | 'unstable' | {diff: string}> {
  const before = await capture()
  const after = await withStyledComponentsFirst(styledTags, capture)
  if (after === before) return 'same'
  if ((await capture()) !== before) return 'unstable'

  const elements = Array.from(window.document.querySelectorAll('*'))
  const stylesAfter = await withStyledComponentsFirst(styledTags, () =>
    readComputedStyles(elements),
  )
  return {diff: formatStyleDiff(elements, readComputedStyles(elements), stylesAfter)}
}

/**
 * Fail the current test when what it renders depends on stylesheet load
 * order.
 *
 * styled-components injects its `<style>` element when the first styled
 * component renders, after the static stylesheets that are imported at
 * module load (`ui5/styles.css`, `@sanity/ui/styles.css`, vanilla-extract
 * `.css.ts` files). Between rules of equal specificity the later stylesheet
 * wins, so a styled-components rule that ties with a static rule — a
 * `styled(Box)` from `ui5` setting what the `ui5` class also sets — wins on
 * that order alone, and loses as soon as the stylesheets load in another
 * order. Moving the styled-components rules ahead of every other stylesheet
 * flips the tie-break; a component that renders differently afterwards
 * relies on it, and the losing styled-components rule needs its specificity
 * raised (`&&` doubles its class) to win regardless of order.
 *
 * A page that is still changing on its own gets a few more attempts and is
 * otherwise left alone.
 */
export async function assertStyleOrderIndependence(): Promise<void> {
  const styledTags = Array.from(
    window.document.head.querySelectorAll<HTMLStyleElement>('style[data-styled]'),
  )
  const {width, height} = window.document.body.getBoundingClientRect()
  if (styledTags.length === 0 || width === 0 || height === 0) return

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // oxlint-disable-next-line eslint/no-await-in-loop -- each attempt decides whether another is needed
    const result = await compareOnce(styledTags)
    if (result === 'same') return
    if (result === 'unstable') continue
    throw new Error(
      [
        'Rendering depends on stylesheet load order: moving the styled-components rules ahead of the static stylesheets (ui5, @sanity/ui, vanilla-extract) changed the screenshot.',
        'A styled-components rule that ties with a static rule wins on order alone; raise its specificity (`&&`) so it wins regardless. Computed styles that changed (before → after):',
        result.diff,
      ].join('\n'),
    )
  }
}
