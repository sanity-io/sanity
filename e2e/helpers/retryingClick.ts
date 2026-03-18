import {expect, type Locator, type Page} from '@playwright/test'

interface PortalChild {
  tag: string
  testId: string | null
  role: string | null
  text: string
  width: number
  height: number
}

interface PortalDiagnostics {
  childCount: number
  visibleChildren: PortalChild[]
}

/**
 * Inspect the document-panel-portal for visible children that may be intercepting
 * pointer events. Returns a description of what's in the portal.
 */
async function getPortalDiagnostics(page: Page): Promise<PortalDiagnostics | null> {
  return page.evaluate(() => {
    const portal = document.querySelector('[data-testid="document-panel-portal"]')
    if (!portal) return null

    const children = Array.from(portal.children)
    const visible = children.filter((el) => {
      const rect = el.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0
    })

    return {
      childCount: children.length,
      visibleChildren: visible.map((el) => {
        const rect = el.getBoundingClientRect()
        return {
          tag: el.tagName.toLowerCase(),
          testId: el.getAttribute('data-testid'),
          role: el.getAttribute('role'),
          text: (el.textContent || '').slice(0, 100).trim(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }
      }),
    }
  })
}

function formatDiagnostics(diagnostics: PortalDiagnostics): string {
  if (diagnostics.visibleChildren.length === 0) {
    return `Portal has ${diagnostics.childCount} children, none visible`
  }
  const items = diagnostics.visibleChildren.map((child) => {
    const id = child.testId ? `[data-testid="${child.testId}"]` : ''
    const role = child.role ? `[role="${child.role}"]` : ''
    return `  <${child.tag}${id}${role}> ${child.width}x${child.height} "${child.text}"`
  })
  return [
    `Portal has ${diagnostics.visibleChildren.length} visible children (${diagnostics.childCount} total):`,
    ...items,
  ].join('\n')
}

function describeLocator(locator: Locator): string {
  // Playwright Locator implements toString() with a human-readable description,
  // but the type definitions don't declare it.
  // oxlint-disable-next-line no-base-to-string -- Locator.toString() is well-defined
  return String(locator)
}

interface RetryingClickOptions {
  /**
   * Maximum number of click attempts before failing.
   * @defaultValue 3
   */
  maxRetries?: number

  /**
   * Timeout per click attempt in milliseconds. If the click is blocked by an
   * overlay for this long, a diagnostic snapshot is captured and the click is retried.
   * @defaultValue 5000
   */
  perAttemptTimeout?: number

  /**
   * Milliseconds to wait between retry attempts, allowing portal content to settle.
   * @defaultValue 1000
   */
  retryDelay?: number
}

/**
 * Click a locator with retry logic and portal diagnostics.
 *
 * The Studio's `document-panel-portal` renders popovers, dialogs, and menus
 * on top of the form content. Transient portal children can intercept pointer
 * events even when no visible dialog is open. This helper:
 *
 * 1. Attempts a normal click (with Playwright's actionability checks).
 * 2. If the click times out, captures what's in the portal (element descriptions,
 *    bounding boxes) and attaches a screenshot to the test report.
 * 3. Retries the click after a delay.
 *
 * This gives CI failures actionable diagnostics instead of a generic timeout error.
 */
// oxlint-disable no-await-in-loop -- sequential retry loop is intentional
export async function retryingClick(
  page: Page,
  target: Locator,
  options?: RetryingClickOptions,
): Promise<void> {
  const {maxRetries = 3, perAttemptTimeout = 5_000, retryDelay = 1_000} = options ?? {}

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await target.click({timeout: perAttemptTimeout})
      return
    } catch (error) {
      if (attempt === maxRetries) throw error

      const diagnostics = await getPortalDiagnostics(page).catch(() => null)
      const targetDesc = describeLocator(target)

      if (diagnostics && diagnostics.visibleChildren.length > 0) {
        console.log(
          `[retryingClick] Attempt ${attempt}/${maxRetries} failed clicking ${targetDesc}.\n${formatDiagnostics(diagnostics)}`,
        )

        // Attach a screenshot to the test report for CI debugging
        try {
          const screenshot = await page.screenshot()
          const {test} = await import('@playwright/test')
          await test
            .info()
            .attach(`portal-overlay-attempt-${attempt}`, {
              body: screenshot,
              contentType: 'image/png',
            })
            .catch(() => {
              // Not in a test context, skip attachment
            })
        } catch {
          // Screenshot or attachment failed, continue with retry
        }
      } else {
        console.log(
          `[retryingClick] Attempt ${attempt}/${maxRetries} failed clicking ${targetDesc} (portal empty or not found)`,
        )
      }

      await page.waitForTimeout(retryDelay)
    }
  }
}
// oxlint-enable no-await-in-loop

/**
 * Click a locator, then wait for an expected result to appear. If the result
 * doesn't appear, retry the click with portal diagnostics.
 *
 * This is useful for actions like opening menus where the click might succeed
 * (dispatched with force) but the result (menu appearing) doesn't materialize
 * because an overlay swallowed the event.
 */
// oxlint-disable no-await-in-loop -- sequential retry loop is intentional
export async function retryingClickUntilVisible(
  page: Page,
  target: Locator,
  expected: Locator,
  options?: RetryingClickOptions,
): Promise<void> {
  const {maxRetries = 3, perAttemptTimeout = 5_000, retryDelay = 1_000} = options ?? {}

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Use force:true since the portal may be blocking, and we want to check
    // whether the action actually worked by looking for the expected element.
    await target.click({force: true})

    const appeared = await expected
      .waitFor({state: 'visible', timeout: perAttemptTimeout})
      .then(() => true)
      .catch(() => false)

    if (appeared) return

    if (attempt === maxRetries) {
      // Capture diagnostics before the final assertion fails
      const diagnostics = await getPortalDiagnostics(page).catch(() => null)
      if (diagnostics) {
        console.log(
          `[retryingClickUntilVisible] All ${maxRetries} attempts failed.\n${formatDiagnostics(diagnostics)}`,
        )
      }
      await expect(expected).toBeVisible({timeout: perAttemptTimeout})
      return
    }

    // Capture diagnostics
    const diagnostics = await getPortalDiagnostics(page).catch(() => null)
    if (diagnostics && diagnostics.visibleChildren.length > 0) {
      const targetDesc = describeLocator(target)
      const expectedDesc = describeLocator(expected)
      console.log(
        `[retryingClickUntilVisible] Attempt ${attempt}/${maxRetries}: clicked ${targetDesc} but ${expectedDesc} not visible.\n${formatDiagnostics(diagnostics)}`,
      )
    }

    await page.waitForTimeout(retryDelay)
  }
}
// oxlint-enable no-await-in-loop
