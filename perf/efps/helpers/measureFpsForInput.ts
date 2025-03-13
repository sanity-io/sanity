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

  const input = page
    .locator(
      `[data-testid="field-${fieldName}"] input[type="text"], ` +
        `[data-testid="field-${fieldName}"] textarea, ` +
        // Add additional selectors to find inputs in CommonDateTimeInput
        `[data-testid*="${fieldName}"] input[type="text"], ` +
        `[data-testid*="${fieldName}"] textarea`,
    )
    .first()
  await input.waitFor({state: 'visible'})
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
