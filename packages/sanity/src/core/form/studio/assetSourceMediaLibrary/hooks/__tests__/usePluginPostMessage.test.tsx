import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {usePluginPostMessage} from '../usePluginPostMessage'

const mocks = vi.hoisted(() => ({token: undefined as string | undefined}))

vi.mock('../useToken', () => ({useToken: () => mocks.token}))

const ORIGIN = 'https://media.sanity.example'

function mountIframe() {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const postMessage = vi.spyOn(iframe.contentWindow!, 'postMessage').mockImplementation(() => {})
  return {iframe, postMessage}
}

describe('usePluginPostMessage', () => {
  beforeEach(() => {
    mocks.token = undefined
  })

  afterEach(() => {
    document.body.replaceChildren()
  })

  it('sends the current token to the iframe once it is set', () => {
    mocks.token = 'access-1'
    const {iframe, postMessage} = mountIframe()
    const {result} = renderHook(() => usePluginPostMessage(ORIGIN))
    act(() => result.current.setIframe(iframe))

    expect(postMessage).toHaveBeenCalledTimes(1)
    expect(postMessage).toHaveBeenCalledWith({type: 'tokenResponse', token: 'access-1'}, ORIGIN)
  })

  it('sends the new token when the credential rotates', () => {
    // The Media Library asks for a token once and keeps it. Under OAuth the access token is
    // revoked at the next rotation, so the iframe's requests start failing with 401 unless it
    // gets the new one.
    mocks.token = 'access-1'
    const {iframe, postMessage} = mountIframe()
    const {result, rerender} = renderHook(() => usePluginPostMessage(ORIGIN))
    act(() => result.current.setIframe(iframe))
    postMessage.mockClear()

    mocks.token = 'access-2'
    rerender()

    expect(postMessage).toHaveBeenCalledTimes(1)
    expect(postMessage).toHaveBeenCalledWith({type: 'tokenResponse', token: 'access-2'}, ORIGIN)
  })

  it('sends nothing for a cookie-authenticated studio', () => {
    const {iframe, postMessage} = mountIframe()
    const {result, rerender} = renderHook(() => usePluginPostMessage(ORIGIN))
    act(() => result.current.setIframe(iframe))
    rerender()

    expect(postMessage).not.toHaveBeenCalled()
  })
})
