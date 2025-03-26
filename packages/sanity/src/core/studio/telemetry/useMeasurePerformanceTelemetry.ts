import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useEffect} from 'react'

import {PerformanceINPMeasured} from '../__telemetry__/performance.telemetry'

function getInterestingAttrs(node: Node | null): undefined | {ui?: string; testId?: string} {
  if (!node || !(node instanceof Element)) {
    return undefined
  }
  const ui = node.getAttribute('data-ui') || undefined
  const testId = node.getAttribute('data-testid') || undefined
  return ui || testId ? {ui, testId} : undefined
}

function getElementIdentifier(node: Node | null) {
  if (!node) {
    return null
  }
  if (!(node instanceof Element)) {
    return node.nodeName
  }
  // Note: Deliberately using classList instead of className here since className isn't always a string
  // See https://developer.mozilla.org/en-US/docs/Web/API/Element/className#notes
  const {nodeName, classList, id} = node
  return (
    nodeName.toLowerCase() +
    (id ? `#${id}` : '') +
    (classList ? `.${classList.value.replaceAll(' ', '.')}` : '')
  )
}

function isPerformanceEventTiming(entry: PerformanceEntry): entry is PerformanceEventTiming {
  return entry.entryType === 'event'
}

/**
 * @internal
 */
export function useMeasurePerformanceTelemetry() {
  const telemetry = useTelemetry()
  const onEvent = useCallback(
    (list: PerformanceObserverEntryList, observer: PerformanceObserver) => {
      const entries = list.getEntries()

      let maxEntry: PerformanceEventTiming | undefined = undefined
      for (const entry of entries) {
        if (!isPerformanceEventTiming(entry)) continue
        if (entry.duration > (maxEntry?.duration || 0)) {
          maxEntry = entry
        }
      }
      if (!maxEntry) {
        return
      }
      telemetry.log(PerformanceINPMeasured, {
        target: getElementIdentifier(maxEntry.target),
        attrs: getInterestingAttrs(maxEntry.target),
        interaction: maxEntry.name,
        duration: maxEntry.duration,
      })
    },
    [telemetry],
  )
  useEffect(() => {
    if (!('PerformanceObserver' in globalThis)) {
      return
    }
    const observer = new PerformanceObserver(onEvent)
    observer.observe({type: 'event', buffered: true})
    // eslint-disable-next-line consistent-return
    return () => {
      observer.disconnect()
    }
  }, [onEvent])
}
