import {type Locator} from 'playwright'

import {type EfpsResult} from '../types'
import {calculatePercentile} from './calculatePercentile'

export async function measureFpsForInput(input: Locator): Promise<EfpsResult> {
  await input.waitFor({state: 'visible'})
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

  await input.click()
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const rendersPromise = input.evaluate(async (el: HTMLInputElement) => {
    const updates: {value: string; timestamp: number}[] = []

    const mutationObserver = new MutationObserver(() => {
      updates.push({value: el.value, timestamp: Date.now()})
    })

    mutationObserver.observe(el, {attributes: true, attributeFilter: ['value']})

    await new Promise<void>((resolve) => {
      const handler = () => {
        el.removeEventListener('blur', handler)
        resolve()
      }

      el.addEventListener('blur', handler)
    })

    return updates
  })

  const inputEvents: {character: string; timestamp: number}[] = []

  for (const character of characters) {
    inputEvents.push({character, timestamp: Date.now()})
    await input.press(character)
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  await input.blur()

  const renderEvents = await rendersPromise

  const latencies = inputEvents.map((inputEvent) => {
    const matchingEvent = renderEvents.find((renderEvent) =>
      renderEvent.value.includes(inputEvent.character),
    )

    if (!matchingEvent) throw new Error(`No matching event for ${inputEvent.character}`)

    return matchingEvent.timestamp - inputEvent.timestamp
  })

  const p50 = 1000 / calculatePercentile(latencies, 0.5)
  const p75 = 1000 / calculatePercentile(latencies, 0.75)
  const p90 = 1000 / calculatePercentile(latencies, 0.9)

  return {p50, p75, p90, latencies}
}
