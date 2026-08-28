import {renderHook} from '@testing-library/react'
import {type RefObject} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {type ConnectionStatus, type FrameState, type VisualEditingConnection} from '../types'
import {useNavigatePreviewFrame} from '../useNavigatePreviewFrame'

const TARGET_ORIGIN = 'https://preview.example'

function createComlink() {
  const post = vi.fn()
  return {comlink: {post} as unknown as VisualEditingConnection, post}
}

function renderNavigateHook(initial: {
  frameUrl: string | undefined
  overlaysConnection: ConnectionStatus
  preview: string | undefined
}) {
  const frameStateRef: RefObject<FrameState> = {
    current: {title: undefined, url: initial.frameUrl},
  }
  const {comlink, post} = createComlink()
  const {rerender} = renderHook(
    (props: {overlaysConnection: ConnectionStatus; preview: string | undefined}) =>
      useNavigatePreviewFrame({
        frameStateRef,
        overlaysConnection: props.overlaysConnection,
        preview: props.preview,
        targetOrigin: TARGET_ORIGIN,
        visualEditingComlink: comlink,
      }),
    {initialProps: {overlaysConnection: initial.overlaysConnection, preview: initial.preview}},
  )
  return {frameStateRef, post, rerender}
}

describe('useNavigatePreviewFrame', () => {
  it('posts a navigation when connected and the preview param diverges from the frame url', () => {
    const {frameStateRef, post} = renderNavigateHook({
      frameUrl: `${TARGET_ORIGIN}/alpha`,
      overlaysConnection: 'connected',
      preview: `${TARGET_ORIGIN}/beta`,
    })

    expect(post).toHaveBeenCalledExactlyOnceWith('presentation/navigate', {
      url: '/beta',
      type: 'replace',
    })
    expect(frameStateRef.current.url).toBe(`${TARGET_ORIGIN}/beta`)
  })

  it('does nothing until the frame has reported a url', () => {
    const {frameStateRef, post} = renderNavigateHook({
      frameUrl: undefined,
      overlaysConnection: 'connected',
      preview: `${TARGET_ORIGIN}/beta`,
    })

    expect(post).not.toHaveBeenCalled()
    expect(frameStateRef.current.url).toBeUndefined()
  })

  it('does not post a navigation to a different origin', () => {
    const {frameStateRef, post} = renderNavigateHook({
      frameUrl: `${TARGET_ORIGIN}/alpha`,
      overlaysConnection: 'connected',
      preview: 'https://other.example/beta',
    })

    expect(post).not.toHaveBeenCalled()
    expect(frameStateRef.current.url).toBe(`${TARGET_ORIGIN}/alpha`)
  })

  it('holds a navigation while the connection is down and delivers it once connected', () => {
    const {frameStateRef, post, rerender} = renderNavigateHook({
      frameUrl: `${TARGET_ORIGIN}/alpha`,
      overlaysConnection: 'reconnecting',
      preview: `${TARGET_ORIGIN}/beta`,
    })

    // While the connection is down nothing can be delivered, and the frame
    // has not navigated: its reported url must not be overwritten, otherwise
    // the navigation is swallowed instead of retried.
    expect(post).not.toHaveBeenCalled()
    expect(frameStateRef.current.url).toBe(`${TARGET_ORIGIN}/alpha`)

    rerender({overlaysConnection: 'connected', preview: `${TARGET_ORIGIN}/beta`})

    expect(post).toHaveBeenCalledExactlyOnceWith('presentation/navigate', {
      url: '/beta',
      type: 'replace',
    })
    expect(frameStateRef.current.url).toBe(`${TARGET_ORIGIN}/beta`)
  })

  it('does not swallow a navigation typed while the overlays were still connecting', () => {
    const {post, rerender} = renderNavigateHook({
      frameUrl: `${TARGET_ORIGIN}/alpha`,
      overlaysConnection: 'connecting',
      preview: `${TARGET_ORIGIN}/beta`,
    })

    expect(post).not.toHaveBeenCalled()

    rerender({overlaysConnection: 'connected', preview: `${TARGET_ORIGIN}/beta`})

    expect(post).toHaveBeenCalledExactlyOnceWith('presentation/navigate', {
      url: '/beta',
      type: 'replace',
    })
  })

  it('does not re-post when the connection cycles after a delivered navigation', () => {
    const {post, rerender} = renderNavigateHook({
      frameUrl: `${TARGET_ORIGIN}/alpha`,
      overlaysConnection: 'connected',
      preview: `${TARGET_ORIGIN}/beta`,
    })

    expect(post).toHaveBeenCalledTimes(1)

    rerender({overlaysConnection: 'reconnecting', preview: `${TARGET_ORIGIN}/beta`})
    rerender({overlaysConnection: 'connected', preview: `${TARGET_ORIGIN}/beta`})

    expect(post).toHaveBeenCalledTimes(1)
  })
})
