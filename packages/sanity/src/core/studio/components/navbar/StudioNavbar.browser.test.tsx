import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {SearchIcon} from '@sanity/icons/Search'
import {UsersIcon} from '@sanity/icons/Users'
import noop from 'lodash-es/noop.js'
import {RouterProvider} from 'sanity/router'
import {Flex, Grid} from 'ui5'
import {beforeEach, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable, withSilentIntersectionObserver} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {Button} from '../../../../ui-components/button/Button'
import {type Tool} from '../../../config/types'
import {createRouter} from '../../router/router'
import {navbar, navGrid, navTools} from './StudioNavbar.css'
import {ToolCollapseMenu} from './tools/ToolCollapseMenu'

function NoopTool() {
  return null
}

function makeTools(titles: string[]): Tool[] {
  return titles.map((title) => ({
    name: title.toLowerCase().replace(/\s+/g, '-'),
    title,
    component: NoopTool,
  }))
}

// The dev test studio's tool menu: roughly 900px of tabs.
const TOOLS = makeTools([
  'Structure',
  'Presentation',
  'Vision',
  'Router debug',
  'FormBuilder repro',
  'Error playground',
  'Media',
  'Variants',
  'Schedules',
  'Releases',
])

// Enough tabs (about 2100px) to outgrow even a navbar wide enough for the centered layout.
const MANY_TOOLS = makeTools(Array.from({length: 20}, (_, index) => `Debug tool ${index + 1}`))

const router = createRouter({tools: [...TOOLS, ...MANY_TOOLS]})

// The side clusters have different natural widths on purpose: only equal
// flexible columns can make them the same width.
const WORKSPACE_BUTTON_STYLE = {width: 160} as const
const RELEASE_BUTTON_STYLE = {width: 80} as const

/**
 * `StudioNavbar`'s frame: its container, grid and tools column classes around
 * the real `ToolCollapseMenu`, with stand-ins for the side clusters (home /
 * workspace / new document / search on the left; presence / help / releases
 * on the right) that are ui5 `Flex` rows like the real ones — and so carry
 * ui5's `min-width: 0`, which is what let the columns collapse.
 */
function NavbarFrame(props: {tools?: Tool[]; width: number}) {
  const {tools = TOOLS, width} = props
  return (
    <TestWrapper schemaTypes={[]}>
      <RouterProvider router={router} state={{tool: 'structure'}} onNavigate={noop}>
        <div className={navbar} style={{width}}>
          <Grid className={navGrid} data-testid="nav-grid" gap={1}>
            <Flex alignItems="center" data-testid="nav-left" gap={2} justifyContent="flex-start">
              <Button
                iconRight={ChevronDownIcon}
                mode="bleed"
                style={WORKSPACE_BUTTON_STYLE}
                text="Test Studio"
              />
              <Button icon={AddIcon} mode="bleed" tooltipProps={null} />
              <Button icon={SearchIcon} mode="bleed" tooltipProps={null} />
            </Flex>
            <Flex alignItems="center" className={navTools} justifyContent="center">
              <ToolCollapseMenu activeToolName="structure" tools={tools} />
            </Flex>
            <Flex alignItems="center" data-testid="nav-right" gap={1} justifyContent="flex-end">
              <Button icon={UsersIcon} mode="bleed" tooltipProps={null} />
              <Button icon={HelpCircleIcon} mode="bleed" tooltipProps={null} />
              <Button mode="bleed" style={RELEASE_BUTTON_STYLE} text="Drafts" />
            </Flex>
          </Grid>
        </div>
      </RouterProvider>
    </TestWrapper>
  )
}

function grid() {
  const el = document.querySelector<HTMLElement>('[data-testid="nav-grid"]')
  if (!el) throw new Error('nav-grid not rendered')
  return el
}

function column(index: 0 | 1 | 2) {
  return grid().children[index] as HTMLElement
}

function columnWidths() {
  return Array.from(grid().children, (child) => child.getBoundingClientRect().width)
}

// The interactive overflow button; the measurement row's clone carries no id.
function overflowButton() {
  return document.querySelector<HTMLElement>('#menu-button')
}

/** Horizontal extent of a cluster's children, which may overflow the column. */
function contentSpan(cluster: Element) {
  const rects = Array.from(cluster.children, (child) => child.getBoundingClientRect())
  return {
    left: Math.min(...rects.map((rect) => rect.left)),
    right: Math.max(...rects.map((rect) => rect.right)),
  }
}

function expectColumnToHugItsContent(index: 0 | 2) {
  const rect = column(index).getBoundingClientRect()
  const span = contentSpan(column(index))
  expect(span.left).toBeGreaterThanOrEqual(rect.left - 1)
  expect(span.right).toBeLessThanOrEqual(rect.right + 1)
  expect(rect.width).toBeCloseTo(span.right - span.left, 0)
}

function expectNoHorizontalOverlap(a: DOMRect, b: DOMRect) {
  expect(a.right <= b.left + 0.5 || b.right <= a.left + 0.5).toBe(true)
}

function expectOverflowButtonClearOfClusters() {
  const button = overflowButton()
  if (!button) throw new Error('overflow button not rendered')
  const rect = button.getBoundingClientRect()
  expectNoHorizontalOverlap(rect, column(0).getBoundingClientRect())
  expectNoHorizontalOverlap(rect, column(2).getBoundingClientRect())
  expect(grid().scrollWidth).toBeLessThanOrEqual(grid().clientWidth)
}

// Wait for CollapseTabList's IntersectionObserver-driven collapse to settle:
// the column widths and the overflow button's position must hold still.
function layoutSignature() {
  const widths = columnWidths().map((width) => Math.round(width))
  const button = overflowButton()?.getBoundingClientRect()
  return `${widths.join(',')}|${button ? `${Math.round(button.left)},${Math.round(button.right)}` : 'none'}`
}

describe('StudioNavbar grid', () => {
  beforeEach(async () => {
    // Wide enough for the old viewport breakpoint (1800px); the grid must not care.
    await page.viewport(2000, 800)
  })

  it('paints the tools, and their overflow button, in its first commit', async () => {
    // The tool menu measures its tools while mounting, so the first frame already shows the
    // ones that fit and the overflow button for the rest. With the observer silenced for the
    // whole test, nothing can arrive later: what is visible is what the first paint showed.
    await withSilentIntersectionObserver(async () => {
      await render(<NavbarFrame width={900} />)

      await expect.element(page.getByRole('link', {name: 'Structure'})).toBeVisible()
      expect(overflowButton()).not.toBeNull()
      await expect.element(page.getByRole('link', {name: 'Releases'})).not.toBeInTheDocument()
      expectOverflowButtonClearOfClusters()
    })
  })

  it('lays out by the width of the navbar, not the viewport', async () => {
    // Room to spare, yet narrower than the centered layout's threshold: the side
    // columns hug their content instead of stretching to equal widths.
    await render(<NavbarFrame width={1500} />)

    await expect.element(page.getByRole('link', {name: 'Releases'})).toBeVisible()
    await expectStable(layoutSignature)

    expect(overflowButton()).toBeNull()
    expectColumnToHugItsContent(0)
    expectColumnToHugItsContent(2)
  })

  it('collapses the tools into the overflow menu when the navbar is narrower than its tools', async () => {
    // The Themer split preview at a 2000px window: each studio, and its navbar,
    // is 900px wide.
    await render(<NavbarFrame width={900} />)

    await expect.poll(overflowButton).not.toBeNull()
    await expect.element(page.getByRole('link', {name: 'Releases'})).not.toBeInTheDocument()
    await expect.element(page.getByRole('link', {name: 'Structure'})).toBeVisible()
    await expectStable(layoutSignature)

    // The side clusters keep their natural width instead of collapsing to 0px,
    // and the overflow button sits inside the tools column, clear of both.
    expectColumnToHugItsContent(0)
    expectColumnToHugItsContent(2)
    expectOverflowButtonClearOfClusters()
  })

  describe('in a wide navbar (tools centered between flexible side columns)', () => {
    it('gives the side columns equal widths when every tool fits', async () => {
      await render(<NavbarFrame width={1900} />)

      await expect.element(page.getByRole('link', {name: 'Releases'})).toBeVisible()
      await expectStable(layoutSignature)

      expect(overflowButton()).toBeNull()
      const [left, , right] = columnWidths()
      expect(left).toBeCloseTo(right, 0)
      // Both columns are wider than their content: the leftover space, not the
      // content, decides their width, which is what centers the tools.
      const leftSpan = contentSpan(column(0))
      expect(left).toBeGreaterThan(leftSpan.right - leftSpan.left + 50)
    })

    it('shrinks the tools column, not the side columns, when the tools outgrow the navbar', async () => {
      await render(<NavbarFrame tools={MANY_TOOLS} width={1900} />)

      await expect.poll(overflowButton).not.toBeNull()
      await expect.element(page.getByRole('link', {name: 'Debug tool 20'})).not.toBeInTheDocument()
      await expect
        .element(page.getByRole('link', {name: 'Debug tool 1', exact: true}))
        .toBeVisible()
      await expectStable(layoutSignature)

      expectColumnToHugItsContent(0)
      expectColumnToHugItsContent(2)
      expectOverflowButtonClearOfClusters()
    })
  })
})
