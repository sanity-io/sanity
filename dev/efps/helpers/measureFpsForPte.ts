import {type Page} from 'playwright'

import {type EfpsResult} from '../types'
import {aggregateLatencies} from './aggregateLatencies'
import {measureBlockingTime} from './measureBlockingTime'

interface MeasureFpsForPteOptions {
  fieldName: string
  label?: string
  page: Page
}

export async function measureFpsForPte({
  fieldName,
  page,
  label,
}: MeasureFpsForPteOptions): Promise<EfpsResult> {
  const start = Date.now()
  const pteField = page.locator(`[data-testid="field-${fieldName}"]`)
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

  await pteField.waitFor({state: 'visible'})
  await new Promise((resolve) => setTimeout(resolve, 500))

  await pteField.click()

  const contentEditable = pteField.locator('[contenteditable="true"]')
  await contentEditable.waitFor({state: 'visible'})

  const rendersPromise = contentEditable.evaluate(
    // Had to add this so we can run the tests
    // eslint-disable-next-line no-new-func
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

      mutationObserver.observe(el, {subtree: true, characterData: true})

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
    ) as (el: HTMLElement) => Promise<
      {
        value: string
        timestamp: number
        textContentProcessingTime: number
      }[]
    >,
  )
  await new Promise((resolve) => setTimeout(resolve, 500))

  const inputEvents: {character: string; timestamp: number}[] = []

  const startingMarker = '___START___|'
  const endingMarker = '___END___'

  await contentEditable.pressSequentially(endingMarker)
  await new Promise((resolve) => setTimeout(resolve, 500))
  for (let i = 0; i < endingMarker.length; i++) {
    await contentEditable.press('ArrowLeft')
  }
  await contentEditable.pressSequentially(startingMarker)
  await new Promise((resolve) => setTimeout(resolve, 500))

  const getBlockingTime = measureBlockingTime(page)
  for (const character of characters) {
    inputEvents.push({character, timestamp: Date.now()})
    await contentEditable.pressSequentially(character)
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  await contentEditable.blur()

  const blockingTime = await getBlockingTime()
  const renderEvents = await rendersPromise

  const latencies = inputEvents.map((inputEvent) => {
    const matchingEvent = renderEvents.find(({value}) => {
      if (!value.includes(startingMarker) || !value.includes(endingMarker)) return false

      const [, afterStartingMarker] = value.split(startingMarker)
      const [beforeEndingMarker] = afterStartingMarker.split(endingMarker)
      return beforeEndingMarker.includes(inputEvent.character)
    })
    if (!matchingEvent) throw new Error(`No matching event for ${inputEvent.character}`)

    return matchingEvent.timestamp - inputEvent.timestamp - matchingEvent.textContentProcessingTime
  })

  return {
    latency: aggregateLatencies(latencies),
    blockingTime,
    label: label || fieldName,
    runDuration: Date.now() - start,
  }
}
