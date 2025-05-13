import {type Page} from 'playwright'

import {type EfpsResult} from '../types'
import {aggregateLatencies} from './aggregateLatencies'
import {measureBlockingTime} from './measureBlockingTime'

interface MeasureFpsForInputOptions {
  label?: string
  page: Page
  fieldName: string
}

export async function measureFpsForInput({
  label,
  fieldName,
  page,
}: MeasureFpsForInputOptions): Promise<EfpsResult> {
  const start = Date.now()

  // Check if browser is running in headless mode
  const browser = page.context().browser()
  const isHeadless = browser?.browserType().name() === 'chromium' && !browser?.isConnected()
  // eslint-disable-next-line no-console
  console.log('Browser running in headless mode:', isHeadless)

  // Wait for loading state to complete
  try {
    await page.waitForSelector('[data-testid="loading-block"]', {state: 'hidden', timeout: 60000})
    await page.locator('[data-testid="form-view"]').waitFor({state: 'visible', timeout: 30_000})
  } catch (error) {
    console.error('Loading block did not disappear:', error)
    throw error
  }

  // eslint-disable-next-line no-console
  console.log(`Looking for field: ${fieldName}`)
  // eslint-disable-next-line no-console
  console.log(
    `Selector: [data-testid="field-${fieldName}"] input[type="text"], [data-testid="field-${fieldName}"] textarea`,
  )

  // Log all data-testid elements and their visibility state
  const testIdInfo = await Promise.all(
    (await page.$$('[data-testid]')).map(async (el) => {
      const testId = await el.getAttribute('data-testid')
      const isVisible = await el.isVisible()
      const tagName = await el.evaluate((node) => node.tagName.toLowerCase())
      return {testId, isVisible, tagName}
    }),
  )
  console.log('All data-testid elements:', testIdInfo)

  // Log the page HTML to see what's actually rendered
  const pageContent = await page.content()
  // eslint-disable-next-line no-console
  console.log('Page HTML:', pageContent)

  const input = page
    .locator(
      `[data-testid="field-${fieldName}"] input[type="text"], ` +
        `[data-testid="field-${fieldName}"] textarea`,
    )
    .first()

  console.log('input:', input)
  try {
    await input.waitFor({state: 'visible', timeout: 60000})
  } catch (error) {
    console.error('Failed to find input element:', error)
    // Log all elements with data-testid attributes to see what's available
    const allTestIds = await page.$$('[data-testid]')
    // eslint-disable-next-line no-console
    console.log(
      'All elements with data-testid:',
      await Promise.all(allTestIds.map((el) => el.getAttribute('data-testid'))),
    )

    throw error
  }

  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

  await input.click()
  await new Promise((resolve) => setTimeout(resolve, 500))

  const rendersPromise = input.evaluate(async (el: HTMLInputElement | HTMLTextAreaElement) => {
    const updates: {value: string; timestamp: number}[] = []

    const mutationObserver = new MutationObserver(() => {
      updates.push({value: el.value, timestamp: Date.now()})
    })

    if (el instanceof HTMLTextAreaElement) {
      mutationObserver.observe(el, {childList: true, characterData: true, subtree: true})
    } else {
      mutationObserver.observe(el, {attributes: true, attributeFilter: ['value']})
    }

    await new Promise<void>((resolve) => {
      const handler = () => {
        el.removeEventListener('blur', handler)
        resolve()
      }

      el.addEventListener('blur', handler)
    })

    return updates
  })
  await new Promise((resolve) => setTimeout(resolve, 500))

  const inputEvents: {character: string; timestamp: number}[] = []

  const startingMarker = '__START__|'
  const endingMarker = '__END__'

  await input.pressSequentially(endingMarker)
  await new Promise((resolve) => setTimeout(resolve, 500))
  for (let i = 0; i < endingMarker.length; i++) {
    await input.press('ArrowLeft')
  }
  await input.pressSequentially(startingMarker)
  await new Promise((resolve) => setTimeout(resolve, 500))

  const getBlockingTime = measureBlockingTime(page)

  for (const character of characters) {
    inputEvents.push({character, timestamp: Date.now()})
    await input.press(character)
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  await input.blur()

  await page.evaluate(() => window.document.dispatchEvent(new CustomEvent('__finish')))

  const blockingTime = await getBlockingTime()
  const renderEvents = await rendersPromise

  await new Promise((resolve) => setTimeout(resolve, 500))

  const latencies = inputEvents.map((inputEvent) => {
    const matchingEvent = renderEvents.find(({value}) => {
      if (!value.includes(startingMarker) || !value.includes(endingMarker)) return false

      const [, afterStartingMarker] = value.split(startingMarker)
      const [beforeEndingMarker] = afterStartingMarker.split(endingMarker)
      return beforeEndingMarker.includes(inputEvent.character)
    })
    if (!matchingEvent) throw new Error(`No matching event for ${inputEvent.character}`)

    return matchingEvent.timestamp - inputEvent.timestamp
  })

  return {
    latency: aggregateLatencies(latencies),
    blockingTime,
    label: label || fieldName,
    runDuration: Date.now() - start,
  }
}
