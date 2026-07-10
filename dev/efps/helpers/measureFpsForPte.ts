import {type Page} from 'playwright'

import {type EfpsResult} from '../types'
import {aggregateLatencies} from './aggregateLatencies'
import {measureBlockingTime} from './measureBlockingTime'
import {containsBetweenMarkers, setUpMarkers, typeCharacterReliably} from './typeCharacterReliably'

interface MeasureFpsForPteOptions {
  fieldName: string
  label?: string
  page: Page
  /** Timeout in milliseconds for waiting on elements. Defaults to 60000 (60s) */
  timeout?: number
}

const DEFAULT_TIMEOUT = 60_000

export async function measureFpsForPte({
  fieldName,
  page,
  label,
  timeout = DEFAULT_TIMEOUT,
}: MeasureFpsForPteOptions): Promise<EfpsResult> {
  const start = Date.now()
  const pteField = page.locator(`[data-testid="field-${fieldName}"]`)
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

  await pteField.waitFor({state: 'visible', timeout})
  await new Promise((resolve) => setTimeout(resolve, 500))

  await pteField.click()

  const contentEditable = pteField.locator('[contenteditable="true"]')
  await contentEditable.waitFor({state: 'visible', timeout})

  // The recorder is attached to the stable field wrapper rather than the
  // contenteditable itself, and it runs until the harness dispatches the
  // `__finish` event rather than until blur. Both matter for resilience to a
  // transient read-only flip mid-run (see `typeCharacterReliably`): a flip
  // remounts/blurs the editable, which would detach a MutationObserver bound to
  // it and end a blur-based recording early — leaving no render events for the
  // characters typed after the flip ("No matching event" failures). `childList`
  // is also observed so text landing in freshly created DOM nodes isn't missed.
  const rendersPromise = pteField.evaluate(
    // Had to add this so we can run the tests
    new Function(
      'el',
      `
    return (async function() {
      const updates = []

      const mutationObserver = new MutationObserver(() => {
        const textStart = performance.now()
        const textContent = el.textContent || ''
        const textEnd = performance.now()

        updates.push({
          value: textContent,
          timestamp: Date.now(),
          textContentProcessingTime: textEnd - textStart,
        })
      })

      mutationObserver.observe(el, {subtree: true, characterData: true, childList: true})

      await new Promise((resolve) => {
        document.addEventListener('__finish', resolve, {once: true})
      })

      mutationObserver.disconnect()

      return updates
    })()
  `,
    ) as (el: HTMLElement) => Promise<
      {
        value: string
        timestamp: number
        textContentProcessingTime: number
      }[]
    >,
  )
  // This evaluate runs until the `__finish` event and is only awaited later.
  // If the context is torn down first — the A/B harness closes both browsers
  // once one side settles — this promise would reject with no handler attached,
  // an *unhandled rejection* that crashes the process and bypasses retries.
  // Swallow that here so a failing run stays catchable.
  const safeRendersPromise = rendersPromise.catch(
    (): {value: string; timestamp: number; textContentProcessingTime: number}[] => [],
  )
  await new Promise((resolve) => setTimeout(resolve, 500))

  const inputEvents: {character: string; timestamp: number}[] = []

  const startingMarker = '___START___|'
  const endingMarker = '___END___'

  await setUpMarkers({
    page,
    input: contentEditable,
    startingMarker,
    endingMarker,
    getValue: async () => (await contentEditable.textContent()) ?? '',
    timeout,
  })
  await new Promise((resolve) => setTimeout(resolve, 500))

  const getBlockingTime = measureBlockingTime(page)
  for (const character of characters) {
    // Type the character and confirm it registered before moving on, retrying
    // if it was swallowed by a transient read-only flip. The returned timestamp
    // is the moment the landing keystroke was dispatched, so a retried
    // character's latency isn't inflated. See `typeCharacterReliably`.
    const timestamp = await typeCharacterReliably({
      page,
      input: contentEditable,
      character,
      startingMarker,
      endingMarker,
      getValue: async () => (await contentEditable.textContent()) ?? '',
      timeout,
    })
    inputEvents.push({character, timestamp})
  }

  await contentEditable.blur()

  await page.evaluate(() => window.document.dispatchEvent(new CustomEvent('__finish')))

  const blockingTime = await getBlockingTime()
  const renderEvents = await safeRendersPromise

  const latencies = inputEvents.map((inputEvent) => {
    const matchingEvent = renderEvents.find(({value}) =>
      containsBetweenMarkers(value, inputEvent.character, startingMarker, endingMarker),
    )
    if (!matchingEvent) {
      throw new Error(
        `No matching event for ${JSON.stringify(inputEvent.character)} ` +
          `(${renderEvents.length} render events recorded; ` +
          `last recorded value: ${JSON.stringify(tail(renderEvents.at(-1)?.value))})`,
      )
    }

    return matchingEvent.timestamp - inputEvent.timestamp - matchingEvent.textContentProcessingTime
  })

  return {
    latency: aggregateLatencies(latencies),
    blockingTime,
    label: label || fieldName,
    runDuration: Date.now() - start,
  }
}

/** The last part of a (potentially huge) recorded value — the markers live at the end. */
function tail(value: string | undefined): string {
  if (value === undefined) return '(no events recorded)'
  return value.length > 200 ? `…${value.slice(-200)}` : value
}
