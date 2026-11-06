import {type StatusEvent} from '@sanity/comlink'
import {act, render, screen} from '@testing-library/react'
import {PresentationContext} from 'sanity/_singletons'
import {describe, expect, it, onTestFinished, vi} from 'vitest'
import {createActor} from 'xstate'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {openPreviewUrlMachine} from '../../machines/open-preview-url'
import {presentationMachine} from '../../machines/presentation-machine'
import {previewUrlMachine} from '../../machines/preview-url'
import {type ConnectionStatus} from '../../types'
import {PreviewHeader} from '../PreviewHeader'

// The location input reads the preview URL machine's resolved origin and allow patterns, which
// it only has once its resolvers ran; the input is not under test here.
vi.mock('../PreviewLocationInput', () => ({
  PreviewLocationInput: () => <input data-testid="preview-location-input" />,
}))

const overlaysStatus = (status: StatusEvent['status'], connection: string) => ({
  type: 'overlays status' as const,
  statusEvent: {connection, status} as StatusEvent,
})

// A started machine arms its connection timeouts (and `failed` logs an error); stop it so
// they cannot fire in a later test.
function startPresentationActor() {
  const presentationRef = createActor(presentationMachine).start()
  onTestFinished(() => {
    presentationRef.stop()
  })
  return presentationRef
}

async function renderHeader(options: {
  overlaysConnection: ConnectionStatus
  presentationRef: ReturnType<typeof createActor<typeof presentationMachine>>
}) {
  const wrapper = await createTestProvider({resources: [presentationUsEnglishLocaleBundle]})
  const targetOrigin = 'https://preview.example'
  const noop = vi.fn()
  render(
    <PresentationContext.Provider
      value={{
        devMode: false,
        name: 'presentation',
        navigate: noop,
        params: {},
        structureParams: {},
        searchParams: {},
      }}
    >
      <PreviewHeader
        canSharePreviewAccess={false}
        canToggleSharePreviewAccess={false}
        canUseSharedPreviewAccess={false}
        handlesPerspectiveChange
        handlesVariantChange
        iframeRef={{current: null}}
        initialUrl={new URL(targetOrigin)}
        loadersConnection="connected"
        navigatorEnabled={false}
        onPathChange={noop}
        onRefresh={noop}
        openPopup={noop}
        openPreviewUrlRef={createActor(openPreviewUrlMachine, {input: {targetOrigin}})}
        overlaysConnection={options.overlaysConnection}
        perspective="drafts"
        presentationRef={options.presentationRef}
        previewUrlRef={createActor(previewUrlMachine, {input: {previewSearchParam: null}})}
        setViewport={noop}
        targetOrigin={targetOrigin}
        toggleOverlay={noop}
        variant={undefined}
        vercelProtectionBypass={null}
        viewport="desktop"
      />
    </PresentationContext.Provider>,
    {wrapper},
  )
  return screen.findByRole('checkbox')
}

describe('PreviewHeader overlays toggle', () => {
  it('is disabled while the overlays connect for the first time', async () => {
    const presentationRef = startPresentationActor()
    presentationRef.send({type: 'iframe loaded'})
    presentationRef.send(overlaysStatus('handshaking', 'visual-editing-1'))

    expect(await renderHeader({overlaysConnection: 'connecting', presentationRef})).toBeDisabled()
  })

  it('stays enabled while a recreated channel reconnects to overlays that were connected', async () => {
    const presentationRef = startPresentationActor()
    presentationRef.send({type: 'iframe loaded'})
    presentationRef.send(overlaysStatus('connected', 'visual-editing-1'))
    // The tool's effects are torn down and run again (a hidden `<Activity>` boundary shown
    // again): the old connection drops before a brand new one starts handshaking
    presentationRef.send(overlaysStatus('disconnected', 'visual-editing-1'))
    const toggle = await renderHeader({overlaysConnection: 'idle', presentationRef})
    expect(toggle).toBeEnabled()

    act(() => presentationRef.send(overlaysStatus('handshaking', 'visual-editing-2')))
    expect(presentationRef.getSnapshot().matches({loaded: {idle: 'reconnecting'}})).toBe(true)
    expect(toggle).toBeEnabled()
  })

  it('is disabled again when a reload brings a page whose overlays have not connected', async () => {
    const presentationRef = startPresentationActor()
    presentationRef.send({type: 'iframe loaded'})
    presentationRef.send(overlaysStatus('connected', 'visual-editing-1'))
    presentationRef.send({type: 'iframe reload'})
    presentationRef.send({type: 'iframe loaded'})

    expect(await renderHeader({overlaysConnection: 'idle', presentationRef})).toBeDisabled()
  })
})
