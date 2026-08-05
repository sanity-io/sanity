import {type SanityClient} from '@sanity/client'
import {describe, expect, it, vi} from 'vitest'

import {withResourceOnProjectHost} from '../withResourceOnProjectHost'

function fakeClient(config: {projectId?: string; apiHost?: string} = {}) {
  const resolved = {projectId: 'abc123', apiHost: 'https://api.sanity.io', ...config}
  const withConfig = vi.fn(() => ({}) as SanityClient)
  return {client: {config: () => resolved, withConfig} as unknown as SanityClient, withConfig}
}

describe('withResourceOnProjectHost', () => {
  it('pins the resource request to the project host', () => {
    const {client, withConfig} = fakeClient()

    withResourceOnProjectHost(client, {resource: {type: 'media-library', id: 'ml123'}})

    expect(withConfig).toHaveBeenCalledWith({
      apiHost: 'https://abc123.api.sanity.io',
      resource: {type: 'media-library', id: 'ml123'},
    })
  })

  it('preserves the rest of the passed config', () => {
    const {client, withConfig} = fakeClient()

    withResourceOnProjectHost(client, {
      resource: {type: 'canvas', id: 'cnv123'},
      apiVersion: '2025-02-19',
    })

    expect(withConfig).toHaveBeenCalledWith({
      apiHost: 'https://abc123.api.sanity.io',
      apiVersion: '2025-02-19',
      resource: {type: 'canvas', id: 'cnv123'},
    })
  })

  it('keeps the scheme and port of a non-default apiHost', () => {
    const {client, withConfig} = fakeClient({apiHost: 'http://api.sanity.work:8080'})

    withResourceOnProjectHost(client, {resource: {type: 'media-library', id: 'ml123'}})

    expect(withConfig).toHaveBeenCalledWith(
      expect.objectContaining({apiHost: 'http://abc123.api.sanity.work:8080'}),
    )
  })

  it('throws rather than silently falling back to the global host', () => {
    const {client} = fakeClient({projectId: undefined})

    expect(() =>
      withResourceOnProjectHost(client, {resource: {type: 'media-library', id: 'ml123'}}),
    ).toThrow(/missing projectId/)
  })
})
