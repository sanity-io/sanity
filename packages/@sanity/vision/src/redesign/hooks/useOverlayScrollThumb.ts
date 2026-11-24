import {type RefObject, useEffect} from 'react'

/** How long the thumb stays visible after the last scroll, unless the pointer is over the strip */
const SCROLL_IDLE_MS = 800
const MIN_THUMB_WIDTH = 24

export interface ScrollThumbMetrics {
  scrollLeft: number
  scrollWidth: number
  clientWidth: number
  /** The width the thumb travels across, the scroller's width without what is pinned over it */
  trackWidth: number
}

export interface ScrollThumbGeometry {
  width: number
  offset: number
}

/** The thumb's width and offset along the track, or `null` when nothing overflows */
export function getScrollThumbGeometry({
  scrollLeft,
  scrollWidth,
  clientWidth,
  trackWidth,
}: ScrollThumbMetrics): ScrollThumbGeometry | null {
  const maxScroll = scrollWidth - clientWidth
  if (maxScroll < 1 || trackWidth <= 0) return null
  const width = Math.min(
    trackWidth,
    Math.max(MIN_THUMB_WIDTH, (trackWidth * clientWidth) / scrollWidth),
  )
  const progress = Math.min(1, Math.max(0, scrollLeft / maxScroll))
  return {width, offset: progress * (trackWidth - width)}
}

/**
 * Drives an overlay scroll thumb for a horizontal scroller whose native scrollbar is hidden, like
 * an editor's tab strip: it takes no room, shows while the scroller scrolls (the CSS also shows
 * it on hover), and can be dragged. Writes straight to the thumb's style, so scrolling never
 * renders.
 */
export function useOverlayScrollThumb({
  scrollerRef,
  contentRef,
  thumbRef,
  endInsetRef,
}: {
  scrollerRef: RefObject<HTMLElement | null>
  /** The scrolled content, observed so the thumb follows tabs that are added or resized */
  contentRef: RefObject<HTMLElement | null>
  thumbRef: RefObject<HTMLElement | null>
  /** An element pinned over the scroller's right edge, which the thumb stays clear of */
  endInsetRef: RefObject<HTMLElement | null>
}): void {
  useEffect(() => {
    const scroller = scrollerRef.current
    const thumb = thumbRef.current
    if (!scroller || !thumb) return undefined

    const metrics = (): ScrollThumbMetrics => ({
      scrollLeft: scroller.scrollLeft,
      scrollWidth: scroller.scrollWidth,
      clientWidth: scroller.clientWidth,
      trackWidth: scroller.clientWidth - (endInsetRef.current?.offsetWidth ?? 0),
    })

    const update = () => {
      const geometry = getScrollThumbGeometry(metrics())
      thumb.dataset.overflowing = geometry ? 'true' : 'false'
      if (!geometry) return
      thumb.style.width = `${geometry.width}px`
      thumb.style.transform = `translateX(${geometry.offset}px)`
    }

    let idleTimer: ReturnType<typeof setTimeout> | undefined
    const handleScroll = () => {
      update()
      thumb.dataset.scrolling = 'true'
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => delete thumb.dataset.scrolling, SCROLL_IDLE_MS)
    }

    let drag: {pointerId: number; startX: number; startScroll: number} | undefined
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      event.preventDefault()
      thumb.setPointerCapture(event.pointerId)
      thumb.dataset.dragging = 'true'
      drag = {pointerId: event.pointerId, startX: event.clientX, startScroll: scroller.scrollLeft}
    }
    const handlePointerMove = (event: PointerEvent) => {
      if (drag?.pointerId !== event.pointerId) return
      const current = metrics()
      const geometry = getScrollThumbGeometry(current)
      if (!geometry || geometry.width >= current.trackWidth) return
      const scrollPerPixel =
        (current.scrollWidth - current.clientWidth) / (current.trackWidth - geometry.width)
      scroller.scrollLeft = drag.startScroll + (event.clientX - drag.startX) * scrollPerPixel
    }
    const endDrag = (event: PointerEvent) => {
      if (drag?.pointerId !== event.pointerId) return
      drag = undefined
      delete thumb.dataset.dragging
    }

    update()
    scroller.addEventListener('scroll', handleScroll, {passive: true})
    thumb.addEventListener('pointerdown', handlePointerDown)
    thumb.addEventListener('pointermove', handlePointerMove)
    thumb.addEventListener('pointerup', endDrag)
    thumb.addEventListener('pointercancel', endDrag)
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    if (contentRef.current) observer.observe(contentRef.current)

    return () => {
      clearTimeout(idleTimer)
      observer.disconnect()
      scroller.removeEventListener('scroll', handleScroll)
      thumb.removeEventListener('pointerdown', handlePointerDown)
      thumb.removeEventListener('pointermove', handlePointerMove)
      thumb.removeEventListener('pointerup', endDrag)
      thumb.removeEventListener('pointercancel', endDrag)
    }
  }, [contentRef, endInsetRef, scrollerRef, thumbRef])
}
