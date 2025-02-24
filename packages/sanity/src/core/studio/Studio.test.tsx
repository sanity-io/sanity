/**
 * SSR Hydration is hard to get right.
 * It's not a concern when using `sanity dev`, `sanity build` or `sanity deploy` as we ship a client-only application
 * that does not perform any attempt of hydration.
 * However, when using `<Studio />` embedded into a library like Remix or Next.js, then:
 * 1. The server will render as much as it can (including the Studio), in a single render pass.
 *    It's a single pass, code like useEffect, or state setters etc won't trigger a state update or a re-render.
 * 2. The client will then take over, and use the `hydrateRoot` API (https://beta.reactjs.org/apis/react-dom/client/hydrateRoot) which will skip the first render pass and not attempt to produce any HTML or mutate the DOM.
 *    Instead, it will attempt to reuse the existing DOM and only attach event listeners.
 * 3. It's critical that the server and client renders are identical, otherwise the client can in worst case scenarios attach event handlers to the wrong elements.
 *    It may also break `styled-components` hydration, which results elements getting wrong styling, or no styling at all.
 * 4. In development mode React will attempt to detect if there's a mismatch and warn, in production however it opts for speed and skips this check to enable fast hydration.
 *
 * The purpose of this testing suite is to guarantee that `<Studio />` is fully compatible the APIs that are used for hydration:
 * a) https://beta.reactjs.org/apis/react-dom/client/hydrateRoot
 * b) https://beta.reactjs.org/apis/react-dom/server/renderToString
 * c) https://styled-components.com/docs/advanced#server-side-rendering
 */
import {type SanityClient} from '@sanity/client'
import {act} from 'react'
import {hydrateRoot} from 'react-dom/client'
import {renderToStaticMarkup, renderToString} from 'react-dom/server'
import {ServerStyleSheet} from 'styled-components'
import {describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../test/mocks/mockSanityClient'
import {createMockAuthStore} from '../store/_legacy/authStore/createMockAuthStore'
import {Studio} from './Studio'

const client = createMockSanityClient() as any as SanityClient
const config = {
  projectId: 'test',
  dataset: 'test',
  auth: createMockAuthStore({client, currentUser: null}),
}

vi.mock('./components/navbar/new-document')
vi.mock('./components/navbar/presence/PresenceMenu')

describe('Studio', () => {
  it(`SSR to static markup doesn't throw or warn`, () => {
    const spy = vi.spyOn(console, 'error')
    const sheet = new ServerStyleSheet()
    try {
      renderToStaticMarkup(sheet.collectStyles(<Studio config={config} />))
    } finally {
      sheet.seal()
    }

    expect(console.error).not.toHaveBeenCalled()

    spy.mockReset()
    spy.mockRestore()
  })
  it(`SSR to markup for hydration doesn't throw`, async () => {
    const spy = vi.spyOn(console, 'error')
    const node = document.createElement('div')
    document.body.appendChild(node)

    const sheet = new ServerStyleSheet()
    try {
      const html = renderToString(sheet.collectStyles(<Studio config={config} />))
      node.innerHTML = html

      document.head.innerHTML += sheet.getStyleTags()
      const root = await act(() => hydrateRoot(node, <Studio config={config} />))
      await act(() => root.unmount())
    } finally {
      sheet.seal()
    }

    expect(console.error).not.toHaveBeenCalled()

    spy.mockReset()
    spy.mockRestore()
  })
})
