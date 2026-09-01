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
  comlink?: VisualEditingConnection | null
}) {
  const frameStateRef: RefObject<FrameState> = {
    current: {title: undefined, url: initial.frameUrl},
  }
  const {comlink, post} = createComlink()
  const {rerender} = renderHook(
    (props: {
      overlaysConnection: ConnectionStatus
      preview: string | undefined
      comlink?: VisualEditingConnection | null
    }) =>
      useNavigatePreviewFrame({
        frameStateRef,
        overlaysConnection: props.overlaysConnection,
        preview: props.preview,
        targetOrigin: TARGET_ORIGIN,
        visualEditingComlink: props.comlink === undefined ? comlink : props.comlink,
      }),
    {
      initialProps: {
        overlaysConnection: initial.overlaysConnection,
        preview: initial.preview,
        comlink: initial.comlink,
      },
    },
  )
  return {frameStateRef, post, comlink, rerender}
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

    rerender({
      overlaysConnection: 'connected',
      preview: `${TARGET_ORIGIN}/beta`,
      comlink: undefined,
    })

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

    rerender({
      overlaysConnection: 'connected',
      preview: `${TARGET_ORIGIN}/beta`,
      comlink: undefined,
    })

    expect(post).toHaveBeenCalledExactlyOnceWith('presentation/navigate', {
      url: '/beta',
      type: 'replace',
    })
  })

  it('holds a navigation while the comlink handle is unavailable and delivers it once set', () => {
    const {frameStateRef, post, comlink, rerender} = renderNavigateHook({
      frameUrl: `${TARGET_ORIGIN}/alpha`,
      overlaysConnection: 'connected',
      preview: `${TARGET_ORIGIN}/beta`,
      comlink: null,
    })

    // The channel can be torn down (comlink null) before the machine has
    // processed the disconnect, so the connection still reads 'connected'.
    // Nothing can be posted: the frame's reported url must not be overwritten.
    expect(post).not.toHaveBeenCalled()
    expect(frameStateRef.current.url).toBe(`${TARGET_ORIGIN}/alpha`)

    rerender({overlaysConnection: 'connected', preview: `${TARGET_ORIGIN}/beta`, comlink})

    expect(post).toHaveBeenCalledExactlyOnceWith('presentation/navigate', {
      url: '/beta',
      type: 'replace',
    })
    expect(frameStateRef.current.url).toBe(`${TARGET_ORIGIN}/beta`)
  })

  it('does not re-post when the connection cycles after a delivered navigation', () => {
    const {post, rerender} = renderNavigateHook({
      frameUrl: `${TARGET_ORIGIN}/alpha`,
      overlaysConnection: 'connected',
      preview: `${TARGET_ORIGIN}/beta`,
    })

    expect(post).toHaveBeenCalledTimes(1)

    rerender({
      overlaysConnection: 'reconnecting',
      preview: `${TARGET_ORIGIN}/beta`,
      comlink: undefined,
    })
    rerender({
      overlaysConnection: 'connected',
      preview: `${TARGET_ORIGIN}/beta`,
      comlink: undefined,
    })

    expect(post).toHaveBeenCalledTimes(1)
  })
})
