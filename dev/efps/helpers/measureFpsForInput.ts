/* eslint-disable no-new-func */
import {type Page} from 'playwright'

import {type EfpsResult} from '../types'
import {aggregateLatencies} from './aggregateLatencies'
import {measureBlockingTime} from './measureBlockingTime'

interface MeasureFpsForInputOptions {
  label?: string
  page: Page
  fieldName: string
  /** Timeout in milliseconds for waiting on elements. Defaults to 60000 (60s) */
  timeout?: number
}

const DEFAULT_TIMEOUT = 60_000

export async function measureFpsForInput({
  label,
  fieldName,
  page,
  timeout = DEFAULT_TIMEOUT,
}: MeasureFpsForInputOptions): Promise<EfpsResult> {
  const start = Date.now()

  // First, wait for the document form to be visible, indicating the page has loaded
  // This helps avoid flakiness when the page is still loading/hydrating
  const formView = page.locator('[data-testid="form-view"]')
  await formView.waitFor({state: 'visible', timeout})

  const input = page
    .locator(
      `[data-testid="field-${fieldName}"] input[type="text"], ` +
        `[data-testid="field-${fieldName}"] textarea`,
    )
    .first()
  await input.waitFor({state: 'visible', timeout})
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

  await input.click()
  await new Promise((resolve) => setTimeout(resolve, 500))

  const rendersPromise = input.evaluate(
    // Had to add this so we can run the tests
    // oxlint-disable-next-line no-implied-eval
    new Function(
      'el',
      `
    return (async function() {
      const updates = []

      // For textarea, use MutationObserver on text content
      // For input, use 'input' event because MutationObserver on 'value' attribute
      // doesn't work - React/Sanity updates the value property, not the attribute
      if (el instanceof HTMLTextAreaElement) {
        const mutationObserver = new MutationObserver(() => {
          updates.push({value: el.value, timestamp: Date.now()})
        })
        mutationObserver.observe(el, {childList: true, characterData: true, subtree: true})
      } else {
        el.addEventListener('input', () => {
          updates.push({value: el.value, timestamp: Date.now()})
        })
      }

      await new Promise((resolve) => {
        const handler = () => {
          el.removeEventListener('blur', handler)
          resolve()
        }

        el.addEventListener('blur', handler)
      })

      return updates
    })()
  `,
    ) as (
      el: HTMLInputElement | HTMLTextAreaElement,
    ) => Promise<{value: string; timestamp: number}[]>,
  )
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
    await input.pressSequentially(character)
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
