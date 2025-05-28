/* eslint-disable max-nested-callbacks */
import {type SanityClient} from 'sanity'
import {assertType, describe, expectTypeOf, test} from 'vitest'

import {presentationTool} from '../plugin'
import {type PresentationPluginOptions, type PreviewUrlOption} from '../types'

describe('presentationTool()', () => {
  type PresentationToolPluginType = ReturnType<typeof presentationTool>

  test('returns the PresentationToolPluginType type', () => {
    assertType<PresentationToolPluginType>(presentationTool({previewUrl: 'https://example.com'}))
  })

  describe('options.allowOrigins', () => {
    test('allow can be set', () => {
      assertType<PresentationPluginOptions>({
        allowOrigins: ['http://localhost:*'],
        previewUrl: 'http://localhost:3000',
      })
    })

    test('allow can also take a function', () => {
      assertType<PresentationPluginOptions>({
        allowOrigins: ({initialUrl}) => [
          'https://*.sanity.dev',
          'http://localhost:*',
          initialUrl.origin,
        ],
        previewUrl: 'https://example.com',
      })
      assertType<PresentationPluginOptions>({
        allowOrigins: async ({client, origin}) => {
          assertType<SanityClient>(client)
          assertType<string>(origin)
          return await client.fetch<string[]>('*[_id == $id][0].preview.allowOrigins', {
            id: 'settings',
          })
        },
        previewUrl: {
          initial: async ({client, origin}) => {
            assertType<SanityClient>(client)
            assertType<string>(origin)
            return await client.fetch<string>('*[_id == $id][0].preview.initial', {
              id: 'settings',
            })
          },
        },
      })
    })
  })

  describe('options.previewUrl', () => {
    test('has the type of PreviewUrlOption', () => {
      const options: PresentationPluginOptions = {
        previewUrl: 'https://example.com',
      }
      expectTypeOf(options.previewUrl).toEqualTypeOf<PreviewUrlOption>()
    })
    test('can be a string', () => {
      assertType<PreviewUrlOption>('https://example.com')
    })
    test('is required', () => {
      // @ts-expect-error previewUrl is required
      assertType<PresentationToolPluginType>(presentationTool({}))
    })
    test('resolver options supports initial', () => {
      assertType<PreviewUrlOption>({initial: 'https://example.com'})
    })
    test('initial can be a function', () => {
      assertType<PreviewUrlOption>({
        initial: ({origin, client}) => {
          assertType<string>(origin)
          assertType<SanityClient>(client)
          return '/docs'
        },
      })
      assertType<PreviewUrlOption>({
        initial: async ({client, origin}) => {
          assertType<SanityClient>(client)
          assertType<string>(origin)
          const initial = await client.fetch<string>('*[_id == $origin][0].preview.initial', {
            origin,
          })
          return initial ?? '/docs'
        },
      })
    })
    test('can define a preview mode handshake', () => {
      assertType<PreviewUrlOption>({
        initial: 'https://example.com',
        previewMode: {
          enable: '/api/preview',
        },
      })
      assertType<PreviewUrlOption>({
        initial: 'https://example.com',
        previewMode: ({targetOrigin, client, origin}) => {
          assertType<string>(targetOrigin)
          assertType<SanityClient>(client)
          assertType<string>(origin)
          return targetOrigin === 'https://example.com' ? {enable: '/api/preview'} : false
        },
      })
      assertType<PreviewUrlOption>({
        initial: 'https://example.com',
        previewMode: async ({client, targetOrigin, origin}) => {
          assertType<SanityClient>(client)
          assertType<string>(origin)
          assertType<string>(targetOrigin)
          const hasPreviewMode = await client.fetch<boolean>(
            '*[_type == "settings" && $origin in origins][0].enabled',
            {origin: targetOrigin},
          )
          return hasPreviewMode ? {enable: '/api/draft-mode/enable'} : false
        },
      })
    })
    describe('deprecated legacy options', () => {
      test('can be an async function', () => {
        assertType<PreviewUrlOption>(
          async ({
            client,
            previewUrlSecret,
            studioPreviewPerspective,
            previewSearchParam,
            studioBasePath,
          }) => {
            assertType<SanityClient>(client)
            assertType<string>(previewUrlSecret)
            assertType<string>(studioPreviewPerspective)
            assertType<string | null | undefined>(previewSearchParam)
            assertType<string | null | undefined>(studioBasePath)
            return 'https://example.com'
          },
        )
      })
      test('can pass object with origin', () => {
        assertType<PreviewUrlOption>({
          origin: 'http://localhost:3000',
        })
      })
      test('can pass object with preview', () => {
        assertType<PreviewUrlOption>({
          preview: '/',
        })
      })
      test('can pass object with origin, and preview', () => {
        assertType<PreviewUrlOption>({
          origin: 'http://localhost:3000',
          preview: '/',
        })
      })
      test('can pass object with previewMode', () => {
        assertType<PreviewUrlOption>({
          previewMode: {
            enable: '/api/preview',
          },
        })
      })
      test('can pass object with draftMode', () => {
        assertType<PreviewUrlOption>({
          draftMode: {
            enable: '/api/draft-mode/enable',
          },
        })
      })
    })
  })
})
