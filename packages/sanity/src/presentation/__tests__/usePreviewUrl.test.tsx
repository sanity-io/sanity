import {
  urlSearchParamVercelProtectionBypass,
  urlSearchParamVercelSetBypassCookie,
} from '@sanity/preview-url-secret/constants'
import {definePreviewUrl} from '@sanity/preview-url-secret/define-preview-url'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {renderToStaticMarkup} from 'react-dom/server'
import {type SanityClient} from 'sanity'
import {suspend} from 'suspend-react'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {type PreviewUrlOption} from '../types'
import {usePreviewUrl} from '../usePreviewUrl'

vi.mock('sanity', async () => {
  const sanity = await vi.importActual('sanity')
  return {
    ...sanity,
    useActiveWorkspace: () => null,
    useClient: () => null,
    useCurrentUser: () => null,
  }
})
vi.mock('sanity/router')
vi.mock('sanity/structure')
vi.mock('suspend-react')

beforeEach(() => {
  vi.resetAllMocks()
})

function TestPrinter(props: {previewUrl: PreviewUrlOption; previewSearchParam?: string | null}) {
  return `${usePreviewUrl(props.previewUrl, 'presentation', 'previewDrafts', props.previewSearchParam || null, true)}`
}

describe('previewUrl handling', () => {
  test.skip('/preview', async () => {
    expect(renderToStaticMarkup(<TestPrinter previewUrl="/preview" />)).toMatchInlineSnapshot(
      `"http://localhost:3000/preview"`,
    )
  })

  test.skip('/', async () => {
    expect(renderToStaticMarkup(<TestPrinter previewUrl="/" />)).toMatchInlineSnapshot(
      `"http://localhost:3000/"`,
    )
  })

  test('Preview Mode on same origin', async () => {
    const previewUrl = {
      previewMode: {enable: '/api/draft'},
    } satisfies PreviewUrlOption
    const resolvePreviewUrl = definePreviewUrl<SanityClient>(previewUrl)
    let resolvedPreviewUrl = await resolvePreviewUrl({
      client: null as unknown as SanityClient,
      previewUrlSecret: 'abc123',
      previewSearchParam: null,
      studioPreviewPerspective: 'previewDraft',
    })
    vi.mocked(suspend).mockReturnValue(resolvedPreviewUrl)
    expect(renderToStaticMarkup(<TestPrinter previewUrl={previewUrl} />)).toMatchInlineSnapshot(
      `"http://localhost:3000/api/draft?sanity-preview-secret=abc123&amp;sanity-preview-perspective=previewDraft&amp;sanity-preview-pathname=%2F"`,
    )
    resolvedPreviewUrl = await resolvePreviewUrl({
      client: null as unknown as SanityClient,
      previewUrlSecret: 'dfg456',
      previewSearchParam: '/preview',
      studioPreviewPerspective: 'previewDraft',
    })
    vi.mocked(suspend).mockReturnValue(resolvedPreviewUrl)
    expect(renderToStaticMarkup(<TestPrinter previewUrl={previewUrl} />)).toMatchInlineSnapshot(
      `"http://localhost:3000/api/draft?sanity-preview-secret=dfg456&amp;sanity-preview-perspective=previewDraft&amp;sanity-preview-pathname=%2Fpreview"`,
    )
  })

  test('Preview Mode on same origin with redirect', async () => {
    const previewUrl = {
      preview: '/preview',
      previewMode: {enable: '/api/draft'},
    } satisfies PreviewUrlOption
    const resolvePreviewUrl = definePreviewUrl<SanityClient>(previewUrl)
    let resolvedPreviewUrl = await resolvePreviewUrl({
      client: null as unknown as SanityClient,
      previewUrlSecret: 'abc123',
      previewSearchParam: null,
      studioPreviewPerspective: 'previewDraft',
    })
    vi.mocked(suspend).mockReturnValue(resolvedPreviewUrl)
    expect(renderToStaticMarkup(<TestPrinter previewUrl={previewUrl} />)).toMatchInlineSnapshot(
      `"http://localhost:3000/api/draft?sanity-preview-secret=abc123&amp;sanity-preview-perspective=previewDraft&amp;sanity-preview-pathname=%2Fpreview"`,
    )
    resolvedPreviewUrl = await resolvePreviewUrl({
      client: null as unknown as SanityClient,
      previewUrlSecret: 'dfg456',
      previewSearchParam: '/preview',
      studioPreviewPerspective: 'previewDraft',
    })
    vi.mocked(suspend).mockReturnValue(resolvedPreviewUrl)
    expect(renderToStaticMarkup(<TestPrinter previewUrl={previewUrl} />)).toMatchInlineSnapshot(
      `"http://localhost:3000/api/draft?sanity-preview-secret=dfg456&amp;sanity-preview-perspective=previewDraft&amp;sanity-preview-pathname=%2Fpreview"`,
    )
  })

  test('Preview Mode on cross origin', async () => {
    const previewUrl = {
      origin: 'https://my.vercel.app',
      previewMode: {enable: '/api/draft'},
    } satisfies PreviewUrlOption
    const resolvePreviewUrl = definePreviewUrl<SanityClient>(previewUrl)
    let resolvedPreviewUrl = await resolvePreviewUrl({
      client: null as unknown as SanityClient,
      previewUrlSecret: 'abc123',
      previewSearchParam: null,
      studioPreviewPerspective: 'previewDraft',
    })
    vi.mocked(suspend).mockReturnValue(resolvedPreviewUrl)
    expect(renderToStaticMarkup(<TestPrinter previewUrl={previewUrl} />)).toMatchInlineSnapshot(
      `"https://my.vercel.app/api/draft?sanity-preview-secret=abc123&amp;sanity-preview-perspective=previewDraft&amp;sanity-preview-pathname=%2F"`,
    )
    resolvedPreviewUrl = await resolvePreviewUrl({
      client: null as unknown as SanityClient,
      previewUrlSecret: 'dfg456',
      previewSearchParam: '/preview',
      studioPreviewPerspective: 'previewDraft',
    })
    vi.mocked(suspend).mockReturnValue(resolvedPreviewUrl)
    expect(renderToStaticMarkup(<TestPrinter previewUrl={previewUrl} />)).toMatchInlineSnapshot(
      `"https://my.vercel.app/api/draft?sanity-preview-secret=dfg456&amp;sanity-preview-perspective=previewDraft&amp;sanity-preview-pathname=%2Fpreview"`,
    )
  })

  test('Preview Mode on cross origin with redirect', async () => {
    const previewUrl = {
      origin: 'https://my.vercel.app',
      preview: '/preview',
      previewMode: {
        enable: `/api/draft-mode/enable?${new URLSearchParams({
          [urlSearchParamVercelProtectionBypass]: 'abc123',
          // samesitenone is required since the request is from an iframe
          [urlSearchParamVercelSetBypassCookie]: 'samesitenone',
        })}`,
      },
    } satisfies PreviewUrlOption
    const resolvePreviewUrl = definePreviewUrl<SanityClient>(previewUrl)
    let resolvedPreviewUrl = await resolvePreviewUrl({
      client: null as unknown as SanityClient,
      previewUrlSecret: 'abc123',
      previewSearchParam: null,
      studioPreviewPerspective: 'previewDraft',
    })
    vi.mocked(suspend).mockReturnValue(resolvedPreviewUrl)
    expect(renderToStaticMarkup(<TestPrinter previewUrl={previewUrl} />)).toMatchInlineSnapshot(
      `"https://my.vercel.app/api/draft-mode/enable?x-vercel-protection-bypass=abc123&amp;x-vercel-set-bypass-cookie=samesitenone&amp;sanity-preview-secret=abc123&amp;sanity-preview-perspective=previewDraft&amp;sanity-preview-pathname=%2Fpreview"`,
    )
    resolvedPreviewUrl = await resolvePreviewUrl({
      client: null as unknown as SanityClient,
      previewUrlSecret: 'dfg456',
      previewSearchParam: '/preview',
      studioPreviewPerspective: 'previewDraft',
    })
    vi.mocked(suspend).mockReturnValue(resolvedPreviewUrl)
    expect(renderToStaticMarkup(<TestPrinter previewUrl={previewUrl} />)).toMatchInlineSnapshot(
      `"https://my.vercel.app/api/draft-mode/enable?x-vercel-protection-bypass=abc123&amp;x-vercel-set-bypass-cookie=samesitenone&amp;sanity-preview-secret=dfg456&amp;sanity-preview-perspective=previewDraft&amp;sanity-preview-pathname=%2Fpreview"`,
    )
  })

  test.skip('Invalid URL', () => {
    expect(() =>
      renderToStaticMarkup(<TestPrinter previewUrl="//" />),
    ).toThrowErrorMatchingInlineSnapshot(`[TypeError: Invalid URL]`)
    expect(() =>
      renderToStaticMarkup(<TestPrinter previewUrl={{previewMode: {enable: '//'}}} />),
    ).toThrowErrorMatchingInlineSnapshot(`[TypeError: Invalid URL]`)
    expect(() =>
      renderToStaticMarkup(
        <TestPrinter previewUrl={{preview: '//', previewMode: {enable: '/api/enable'}}} />,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`[TypeError: Invalid URL]`)
    expect(() =>
      renderToStaticMarkup(
        <TestPrinter previewUrl={{origin: '//', previewMode: {enable: '/api/enable'}}} />,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`[TypeError: Invalid URL]`)
  })
})
