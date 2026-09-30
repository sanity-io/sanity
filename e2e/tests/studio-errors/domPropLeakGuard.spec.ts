/**
 * The DOM prop leak guard in `helpers/studioErrors.ts` runs in every spec. These tests check that
 * it works against the build under test (production in CI): that it finds the props React keeps
 * on the elements it renders, and that it reports one that should not be there.
 */

// oxlint-disable-next-line no-restricted-imports -- the leak test must not run under the fixture that fails on leaks
import {expect, test as base} from '@playwright/test'

import {DOM_PROP_LEAK_MARKER} from '../../helpers/domPropLeaks/scanner'
import {watchForStudioErrors} from '../../helpers/studioErrors'
import {test} from '../../studio-test'

test.describe('DOM prop leak guard', () => {
  test('checks the props of the elements the studio renders', async ({page, context}) => {
    await page.goto('/content')
    await expect(page.getByTestId('studio-navbar')).toBeVisible()

    const report = await (await watchForStudioErrors(context)).collectDomPropLeaks()
    const studioScan = report.scans.find((scan) => scan.studioRendered)
    expect(studioScan?.stats.reactElements).toBeGreaterThan(100)
    expect(report.problems).toEqual([])
  })
})

base.describe('DOM prop leak guard', () => {
  base('reports props that reach DOM elements', async ({page, context, baseURL}) => {
    const watcher = await watchForStudioErrors(context)
    await page.goto(`${baseURL}/content`)
    await expect(page.getByTestId('studio-navbar')).toBeVisible()

    const logged = page.waitForEvent('console', (msg) =>
      msg.text().startsWith(DOM_PROP_LEAK_MARKER),
    )
    // Give an element that a styled-components styled tag rendered the props React would give
    // it if a component spread `intent` and `isOpen` onto it.
    const tag = await page.evaluate(() => {
      for (const element of document.querySelectorAll('#sanity *')) {
        const propsKey = Object.keys(element).find((key) => key.startsWith('__reactProps$'))
        if (!propsKey) continue
        const fiberKey = propsKey.replace('__reactProps$', '__reactFiber$')
        const fields = element as unknown as Record<string, unknown>
        const fiber = fields[fiberKey] as {return?: {elementType?: unknown}} | undefined
        const styled = fiber?.return?.elementType as
          | {styledComponentId?: unknown; shouldForwardProp?: unknown}
          | undefined
        if (typeof styled?.styledComponentId !== 'string' || styled.shouldForwardProp) continue
        fields[propsKey] = {...(fields[propsKey] as object), intent: 'edit', isOpen: true}
        element.setAttribute('data-dom-prop-leak-test', '')
        return element.localName
      }
      return null
    })
    expect(tag).not.toBeNull()
    await logged

    // A new document: the findings of the previous one only survive in what it logged.
    await page.reload()
    await expect(page.getByTestId('studio-navbar')).toBeVisible()

    const {findings} = await watcher.collectDomPropLeaks()
    expect(findings).toEqual([
      expect.objectContaining({
        rule: 'styled-components',
        prop: 'intent',
        tag,
        element: expect.stringContaining('data-dom-prop-leak-test'),
      }),
      expect.objectContaining({
        rule: 'react',
        prop: 'isOpen',
        message: expect.stringContaining('React does not recognize the `isOpen` prop'),
        tag,
      }),
    ])
    // The production build keeps component names, which is what makes a finding actionable.
    expect(findings[0].components.length).toBeGreaterThan(3)

    await expect(watcher.flush()).rejects.toThrow(
      new RegExp(`\`intent\` on <${tag}> \\[styled-components\\]\\n.*\\n  rendered by: \\S`),
    )
  })
})
