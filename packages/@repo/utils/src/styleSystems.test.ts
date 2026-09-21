// @vitest-environment jsdom
import {beforeEach, describe, expect, test} from 'vitest'

import {
  percentage,
  STYLE_METRICS,
  STYLE_SYSTEMS,
  styledRuleShare,
  styleMetricFor,
  takeStyleCensus,
  ui5Share,
} from './styleSystems'

/** A page as the migration leaves it: v5, v4 and styled-components nodes side by side. */
function renderPage(options: {ui5?: boolean; styled?: boolean; stylesheet?: string} = {}) {
  const {
    ui5 = true,
    styled = true,
    stylesheet = '.static { color: red } .other { margin: 0 }',
  } = options
  document.head.innerHTML = `<style>${stylesheet}</style>`
  document.body.innerHTML = [
    ui5 ? '<div class="sui-box sui-flex"><span class="sui-text">v5</span></div>' : '',
    '<div data-ui="Card"><button data-ui="Button">v4</button></div>',
    // A v4 node mid-migration also carries a v5 class: counted as v5, not v4
    ui5 ? '<div data-ui="Stack" class="sui-stack">both</div>' : '',
    styled
      ? [
          '<div class="Root-sc-abc123-0 gqpuxg">a</div>',
          '<div class="Root-sc-abc123-0 hjklmn">a again</div>',
          '<span class="sc-dkzDqf bXyZ">b</span>',
          // A styled() wrapper around a v4 component stays a v4 node: the
          // widget's rule is that resolved v4 nodes leave the styled count
          '<div data-ui="Box" class="sc-wrapped">c</div>',
        ].join('')
      : '',
  ].join('')
  if (styled) {
    const style = document.createElement('style')
    style.dataset.styled = 'active'
    style.dataset.styledVersion = '6.5.3'
    style.textContent = '.gqpuxg{color:red;}.hjklmn{margin:0;}.bXyZ{padding:1px;}'
    document.head.appendChild(style)
  }
}

beforeEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
})

describe('takeStyleCensus', () => {
  test('counts rendered nodes per style system, v5 winning over v4 and v4 over styled', () => {
    renderPage()
    const census = takeStyleCensus(document)
    // sui-box, sui-text, and the mid-migration node
    expect(census.nodes.ui5).toBe(3)
    // Card, Button and the styled() wrapper around Box; the sui-stack went to v5
    expect(census.nodes.ui4).toBe(3)
    // Root twice and sc-dkzDqf; the wrapper around a v4 node is v4's
    expect(census.nodes.styled).toBe(3)
  })

  test('counts distinct component ids behind the rendered styled nodes', () => {
    renderPage()
    const census = takeStyleCensus(document)
    // Root-sc-abc123-0 renders twice, sc-dkzDqf once
    expect(census.styledComponents.components).toBe(2)
  })

  test('reads the styled-components sheet like the diagnostics dialog does', () => {
    renderPage()
    const census = takeStyleCensus(document)
    expect(census.styledComponents.styleTags).toBe(1)
    expect(census.styledComponents.cssRules).toBe(3)
    expect(census.styledComponents.cssBytes).toBeGreaterThan(0)
    expect(census.styledComponents.versions).toEqual(['6.5.3'])
    // The static sheet's two rules plus the three inserted ones
    expect(census.stylesheets.totalRules).toBe(5)
    expect(census.stylesheets.inaccessible).toBe(0)
  })

  test('a page without styled-components reports zeros, not absence', () => {
    renderPage({styled: false})
    const census = takeStyleCensus(document)
    expect(census.nodes.styled).toBe(0)
    expect(census.styledComponents).toEqual({
      components: 0,
      styleTags: 0,
      cssRules: 0,
      cssBytes: 0,
      versions: [],
    })
  })

  test('@sanity/ui v5 is available when a v5 node is rendered', () => {
    renderPage()
    expect(takeStyleCensus(document).ui5Available).toBe(true)
  })

  test('a build without @sanity/ui v5 is not applicable, and its share is null rather than 0', () => {
    renderPage({ui5: false})
    const census = takeStyleCensus(document)
    expect(census.ui5Available).toBe(false)
    expect(census.nodes.ui5).toBe(0)
    expect(census.nodes.ui4).toBe(3)
    expect(ui5Share(census)).toBeNull()
    // The registry agrees: no UI v5 rows, every other row present
    const rows = STYLE_METRICS.map((metric) => [metric.label, metric.read(census)] as const)
    expect(rows.find(([label]) => label === 'UI v5 share')?.[1]).toBeNull()
    expect(rows.find(([label]) => label === 'UI v5 instances')?.[1]).toBeNull()
    expect(rows.find(([label]) => label === 'UI v4 instances')?.[1]).toBe(3)
    expect(rows.find(([label]) => label === 'styled-components instances')?.[1]).toBe(3)
  })
})

describe('shares', () => {
  test('ui5Share is v5 over all @sanity/ui nodes, in percent', () => {
    renderPage()
    // 3 v5 nodes over 3 + 3
    expect(ui5Share(takeStyleCensus(document))).toBeCloseTo(50, 5)
  })

  test('styledRuleShare is the inserted rules over every readable rule', () => {
    renderPage()
    expect(styledRuleShare(takeStyleCensus(document))).toBeCloseTo(60, 5)
  })

  test('percentage has no answer without a denominator', () => {
    expect(percentage(0, 0)).toBeNull()
    expect(percentage(1, 4)).toBe(25)
  })
})

describe('registry', () => {
  test('every fingerprint has a selector, a label and a color', () => {
    expect(STYLE_SYSTEMS.map((system) => system.id)).toEqual(['ui5', 'ui4', 'styled'])
    for (const system of STYLE_SYSTEMS) {
      expect(system.selector).toContain(':is(')
      expect(system.label).not.toBe('')
      expect(system.color).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  test('labels are unique and resolve back to their metric', () => {
    const labels = STYLE_METRICS.map((metric) => metric.label)
    expect(new Set(labels).size).toBe(labels.length)
    for (const metric of STYLE_METRICS) expect(styleMetricFor(metric.label)).toBe(metric)
    expect(styleMetricFor('stringField')).toBeUndefined()
  })

  test('adoption climbs, the escape hatch sinks', () => {
    for (const metric of STYLE_METRICS) {
      expect(metric.goal).toBe(
        metric.label === 'UI v5 share' || metric.label === 'UI v5 instances' ? 'higher' : 'lower',
      )
    }
  })

  test('the style-tag count is recorded but not charted', () => {
    const uncharted = STYLE_METRICS.filter((metric) => metric.charted === false)
    expect(uncharted.map((metric) => metric.label)).toEqual(['styled-components style tags'])
    // Still read off the census, so the row lands on the run document
    renderPage()
    expect(uncharted[0].read(takeStyleCensus(document))).toBe(1)
  })
})
