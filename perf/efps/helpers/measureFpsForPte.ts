import {type Locator} from 'playwright'

import {type EfpsResult} from '../types'
import {calculatePercentile} from './calculatePercentile'

export async function measureFpsForPte(pteField: Locator): Promise<EfpsResult> {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

  await pteField.waitFor({state: 'visible'})
  await new Promise((resolve) => setTimeout(resolve, 500))

  await pteField.click()

  const contentEditable = pteField.locator('[contenteditable="true"]')
  await contentEditable.waitFor({state: 'visible'})

  const rendersPromise = contentEditable.evaluate(async (el: HTMLElement) => {
    const updates: {
      value: string
      timestamp: number
      // with very large PTE fields, it may take time to serialize the result
      // so we capture this time and remove it from the final metric
      textContentProcessingTime: number
    }[] = []

    const mutationObserver = new MutationObserver(() => {
      const start = performance.now()
      const textContent = el.textContent || ''
      const end = performance.now()

      updates.push({
        value: textContent,
        timestamp: Date.now(),
        textContentProcessingTime: end - start,
      })
    })

    mutationObserver.observe(el, {subtree: true, characterData: true})

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

  await contentEditable.pressSequentially(endingMarker)
  await new Promise((resolve) => setTimeout(resolve, 500))
  for (let i = 0; i < endingMarker.length; i++) {
    await contentEditable.press('ArrowLeft')
  }
  await contentEditable.pressSequentially(startingMarker)
  await new Promise((resolve) => setTimeout(resolve, 500))

  for (const character of characters) {
    inputEvents.push({character, timestamp: Date.now()})
    await contentEditable.press(character)
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  await contentEditable.blur()

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

  const p50 = Math.min(1000 / calculatePercentile(latencies, 0.5), 100)
  const p75 = Math.min(1000 / calculatePercentile(latencies, 0.75), 100)
  const p90 = Math.min(1000 / calculatePercentile(latencies, 0.9), 100)

  return {p50, p75, p90, latencies}
}
