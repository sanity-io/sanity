import {Chunk, ChunkType} from '@sanity/field/diff'
import {IconComponent} from '@sanity/icons'
import {useEffect} from 'react'
import {TIMELINE_ICON_COMPONENTS, TIMELINE_LABELS} from './constants'

export function formatTimelineEventLabel(type: ChunkType): string | undefined {
  return TIMELINE_LABELS[type]
}

export function getTimelineEventIconComponent(type: ChunkType): IconComponent | undefined {
  return TIMELINE_ICON_COMPONENTS[type]
}

export function sinceTimelineProps(
  since: Chunk,
  rev: Chunk
): {
  topSelection: Chunk
  bottomSelection: Chunk
  disabledBeforeSelection: boolean
} {
  return {
    topSelection: rev,
    bottomSelection: since,
    disabledBeforeSelection: true,
  }
}

export function revTimelineProps(
  rev: Chunk
): {
  topSelection: Chunk
  bottomSelection: Chunk
} {
  return {
    topSelection: rev,
    bottomSelection: rev,
  }
}

export function useObserveElement(props: {
  element: Element | null
  options?: IntersectionObserverInit
  callback: IntersectionObserverCallback
}): undefined {
  const {element, options, callback} = props

  useEffect(() => {
    if (!element) return undefined

    const ob = new IntersectionObserver(callback, options)

    ob.observe(element)

    return () => {
      ob.unobserve(element)
    }
  }, [callback, element, options])

  return undefined
}
