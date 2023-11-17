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

import React from 'react'
import {renderToStaticMarkup, renderToString} from 'react-dom/server'
import {ServerStyleSheet} from 'styled-components'
import {act} from 'react-dom/test-utils'
import {hydrateRoot} from 'react-dom/client'
import {SanityClient} from '@sanity/client'
import {createMockAuthStore} from '../store/_legacy/authStore/createMockAuthStore'
import {createMockSanityClient} from '../../../test/mocks/mockSanityClient'
import {Studio} from './Studio'

const client = createMockSanityClient() as any as SanityClient
const config = {
  projectId: 'test',
  dataset: 'test',
  auth: createMockAuthStore({client, currentUser: null}),
}

jest.mock('./components/navbar/new-document')
jest.mock('./components/navbar/presence/PresenceMenu')

describe('Studio', () => {
  it(`SSR to static markup doesn't throw or warn`, () => {
    const spy = jest.spyOn(console, 'error').mockImplementation()
    const sheet = new ServerStyleSheet()
    try {
      const html = renderToStaticMarkup(sheet.collectStyles(<Studio config={config} />))

      expect(html).toMatchInlineSnapshot(
        `"<div class=\\"sc-dkQUOd bRVfWK\\"><div data-ui=\\"Spinner\\" class=\\"sc-bdnyFh jYLJCW sc-crzpnZ fBHPha sc-WZZhM jIkWIU\\"><span><svg data-sanity-icon=\\"spinner\\" width=\\"1em\\" height=\\"1em\\" viewBox=\\"0 0 25 25\\" fill=\\"none\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M4.5 12.5C4.5 16.9183 8.08172 20.5 12.5 20.5C16.9183 20.5 20.5 16.9183 20.5 12.5C20.5 8.08172 16.9183 4.5 12.5 4.5\\" stroke=\\"currentColor\\" stroke-width=\\"1.2\\" stroke-linejoin=\\"round\\"></path></svg></span></div><div data-ui=\\"Text\\" class=\\"sc-bdnyFh hsSmXt sc-ikXxth hRgrbD\\"><span>Loading</span></div></div>"`,
      )
    } finally {
      sheet.seal()
    }

    expect(console.error).not.toHaveBeenCalled()

    spy.mockReset()
    spy.mockRestore()
  })
  it(`SSR to markup for hydration doesn't throw`, () => {
    const spy = jest.spyOn(console, 'error').mockImplementation()
    const sheet = new ServerStyleSheet()
    try {
      const html = renderToString(sheet.collectStyles(<Studio config={config} />))
      expect(html).toMatchInlineSnapshot(
        `"<div class=\\"sc-dkQUOd bRVfWK\\"><div data-ui=\\"Spinner\\" class=\\"sc-bdnyFh jYLJCW sc-crzpnZ fBHPha sc-WZZhM jIkWIU\\"><span><svg data-sanity-icon=\\"spinner\\" width=\\"1em\\" height=\\"1em\\" viewBox=\\"0 0 25 25\\" fill=\\"none\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M4.5 12.5C4.5 16.9183 8.08172 20.5 12.5 20.5C16.9183 20.5 20.5 16.9183 20.5 12.5C20.5 8.08172 16.9183 4.5 12.5 4.5\\" stroke=\\"currentColor\\" stroke-width=\\"1.2\\" stroke-linejoin=\\"round\\"></path></svg></span></div><div data-ui=\\"Text\\" class=\\"sc-bdnyFh hsSmXt sc-ikXxth hRgrbD\\"><span>Loading</span></div></div>"`,
      )
    } finally {
      sheet.seal()
    }

    expect(console.error).not.toHaveBeenCalled()

    spy.mockReset()
    spy.mockRestore()
  })
  it('SSR hydrateRoot finishes without warnings', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation()
    const node = document.createElement('div')
    document.body.appendChild(node)
    const sheet = new ServerStyleSheet()
    try {
      const html = renderToString(sheet.collectStyles(<Studio config={config} />))
      node.innerHTML = html
      expect(html).toMatchInlineSnapshot(
        `"<div class=\\"sc-dkQUOd bRVfWK\\"><div data-ui=\\"Spinner\\" class=\\"sc-bdnyFh jYLJCW sc-crzpnZ fBHPha sc-WZZhM jIkWIU\\"><span><svg data-sanity-icon=\\"spinner\\" width=\\"1em\\" height=\\"1em\\" viewBox=\\"0 0 25 25\\" fill=\\"none\\" xmlns=\\"http://www.w3.org/2000/svg\\"><path d=\\"M4.5 12.5C4.5 16.9183 8.08172 20.5 12.5 20.5C16.9183 20.5 20.5 16.9183 20.5 12.5C20.5 8.08172 16.9183 4.5 12.5 4.5\\" stroke=\\"currentColor\\" stroke-width=\\"1.2\\" stroke-linejoin=\\"round\\"></path></svg></span></div><div data-ui=\\"Text\\" class=\\"sc-bdnyFh hsSmXt sc-ikXxth hRgrbD\\"><span>Loading</span></div></div>"`,
      )
      document.head.innerHTML += sheet.getStyleTags()

      act(() => hydrateRoot(node, <Studio config={config} />))
    } finally {
      sheet.seal()
    }

    expect(console.error).not.toHaveBeenCalled()

    spy.mockReset()
    spy.mockRestore()
  })
})
