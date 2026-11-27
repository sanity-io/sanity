import {useState} from 'react'
import {of} from 'rxjs'
import {type PermissionCheckResult, useWorkspace} from 'sanity'
import {
  ActiveWorkspaceMatcherContext,
  PresentationContext,
  PresentationNavigateContext,
} from 'sanity/_singletons'
import {describe, expect, onTestFinished, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'
import {createActor, fromObservable, fromPromise, waitFor} from 'xstate'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {type WorkspaceSummary} from '../../../core/config/types'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {openPreviewUrlMachine} from '../../machines/open-preview-url'
import {presentationMachine} from '../../machines/presentation-machine'
import {previewUrlMachine} from '../../machines/preview-url'
import {
  type PresentationContextValue,
  type PresentationViewport,
  type PreviewUrlPreviewMode,
} from '../../types'
import {Preview} from '../Preview'

const INITIAL_URL = new URL('/preview', location.origin)

const PRESENTATION_CONTEXT: PresentationContextValue = {
  devMode: false,
  name: 'presentation',
  navigate: () => {},
  params: {},
  structureParams: {},
  searchParams: {},
}

async function startPreviewUrlActor() {
  const actor = createActor(
    previewUrlMachine.provide({
      actors: {
        'check permission': fromObservable(() =>
          of<PermissionCheckResult>({granted: true, reason: 'Matching grant'}),
        ),
        'resolve initial url': fromPromise(async () => INITIAL_URL),
        'resolve allow patterns': fromPromise(async (): Promise<URLPattern[]> => []),
        'resolve preview mode': fromPromise(
          async (): Promise<PreviewUrlPreviewMode | false> => false,
        ),
        'create preview secret': fromPromise(async () => ({
          secret: 'secret',
          expiresAt: new Date(Date.now() + 60_000),
        })),
        'read shared preview secret': fromPromise(async (): Promise<string | null> => null),
        'resolve preview mode url': fromPromise(async () => INITIAL_URL),
      },
    }),
    {input: {previewSearchParam: null}},
  ).start()
  onTestFinished(() => {
    actor.stop()
  })
  await waitFor(actor, (state) => Array.isArray(state.context.allowOrigins))
  return actor
}

const presentationRef = createActor(presentationMachine)
const openPreviewUrlRef = createActor(openPreviewUrlMachine, {
  input: {targetOrigin: INITIAL_URL.origin},
})

type PreviewUrlRef = Awaited<ReturnType<typeof startPreviewUrlActor>>

function PreviewHarness(props: {previewUrlRef: PreviewUrlRef}) {
  return (
    <TestWrapper schemaTypes={[]} i18nBundles={[presentationUsEnglishLocaleBundle]}>
      <PresentationContext value={PRESENTATION_CONTEXT}>
        <PresentationNavigateContext value={() => {}}>
          <PreviewWithViewport previewUrlRef={props.previewUrlRef} />
        </PresentationNavigateContext>
      </PresentationContext>
    </TestWrapper>
  )
}

function PreviewWithViewport(props: {previewUrlRef: PreviewUrlRef}) {
  const [viewport, setViewport] = useState<PresentationViewport>('desktop')
  const workspace = useWorkspace()
  // The header only reads the base path of the active workspace
  const activeWorkspace = {basePath: workspace.basePath} as WorkspaceSummary

  return (
    <ActiveWorkspaceMatcherContext value={{activeWorkspace, setActiveWorkspace: () => {}}}>
      <Preview
        canSharePreviewAccess={false}
        canToggleSharePreviewAccess={false}
        canUseSharedPreviewAccess={false}
        documentPanelOpen
        handlesPerspectiveChange={false}
        handlesVariantChange={false}
        initialUrl={INITIAL_URL}
        loadersConnection="connected"
        navigatorEnabled={false}
        onPathChange={() => {}}
        onRefresh={() => {}}
        openPopup={() => {}}
        openPreviewUrlRef={openPreviewUrlRef}
        overlaysConnection="connected"
        perspective="drafts"
        presentationRef={presentationRef}
        previewUrlRef={props.previewUrlRef}
        setViewport={setViewport}
        targetOrigin={INITIAL_URL.origin}
        toggleDocumentPanel={() => {}}
        toggleOverlay={() => {}}
        variant={undefined}
        vercelProtectionBypass={null}
        viewport={viewport}
      />
    </ActiveWorkspaceMatcherContext>
  )
}

function getIframe(): HTMLIFrameElement {
  const iframe = document.querySelector('iframe')
  if (!iframe) throw new Error('No preview iframe is rendered')
  return iframe
}

interface ViewTransitionCall {
  types: string[]
  /** The elements React names for the transition, as the old state is pictured */
  named: string[]
}

function namedElements(): string[] {
  return Array.from(document.body.querySelectorAll<HTMLElement>('*'))
    .filter((element) => {
      const name = element.style.getPropertyValue('view-transition-name')
      return name !== '' && name !== 'none'
    })
    .map((element) => element.dataset.testid ?? element.dataset.ui ?? element.tagName.toLowerCase())
    .toSorted()
}

/**
 * Stands in for the browser's view transitions: headless Chromium closes the test page when a real
 * one snapshots the preview iframe. The update runs on the next microtask and the animations end at
 * once, as when a transition is skipped
 */
function stubViewTransitions() {
  const calls: ViewTransitionCall[] = []
  const startViewTransition = vi.fn((options: StartViewTransitionOptions) => {
    calls.push({
      types: [...(options.types ?? [])],
      named: namedElements(),
    })
    const updateCallbackDone = Promise.resolve().then(() => options.update?.())
    const ready = updateCallbackDone.then(() => undefined)
    return {
      updateCallbackDone,
      ready,
      finished: ready,
      skipTransition: () => {},
      types: new Set(options.types),
    }
  })
  const root = document.documentElement
  const stubs: [object, string, unknown][] = [
    [document, 'startViewTransition', startViewTransition],
    [root, 'getAnimations', () => []],
  ]
  for (const [target, key, value] of stubs) {
    Object.defineProperty(target, key, {configurable: true, value})
  }
  onTestFinished(() => {
    for (const [target, key] of stubs) Reflect.deleteProperty(target, key)
  })
  return calls
}

function stubReducedMotion() {
  const matchMedia = window.matchMedia.bind(window)
  vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
    matchMedia(query === '(prefers-reduced-motion: reduce)' ? 'all' : query),
  )
  onTestFinished(() => {
    vi.restoreAllMocks()
  })
}

const iframeWidth = () => getIframe().offsetWidth

describe('Preview viewport', () => {
  test('switching to the mobile viewport resizes the iframe in a view transition, under the open tooltip', async () => {
    const transitions = stubViewTransitions()
    const previewUrlRef = await startPreviewUrlActor()
    await render(<PreviewHarness previewUrlRef={previewUrlRef} />)
    await expect.poll(iframeWidth).toBeGreaterThan(375)
    const toggle = page.getByTestId('preview-viewport-toggle')
    await toggle.hover()
    await expect.element(page.getByText('Switch to narrow viewport')).toBeVisible()

    await toggle.click()

    await expect.poll(iframeWidth).toBe(375)
    expect(transitions).toEqual([
      {
        types: ['sanity-iframe-viewport', 'sanity-studio-resize'],
        named: ['Tooltip', 'iframe', 'preview-viewport-toggle'],
      },
    ])
  })

  test('with reduced motion the iframe resizes without a view transition', async () => {
    stubReducedMotion()
    const transitions = stubViewTransitions()
    const previewUrlRef = await startPreviewUrlActor()
    await render(<PreviewHarness previewUrlRef={previewUrlRef} />)
    await expect.poll(iframeWidth).toBeGreaterThan(375)

    await page.getByTestId('preview-viewport-toggle').click()

    await expect.poll(iframeWidth).toBe(375)
    expect(transitions).toEqual([])
  })
})
