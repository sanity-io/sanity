import {DialogProvider, type DialogProviderProps, PortalProvider} from '@sanity/ui'
import {type Dispatch, type ReactNode, type SetStateAction, useMemo} from 'react'
import {getSanityCreateLinkMetadata, useSanityCreateConfig, useZIndex} from 'sanity'

import {TooltipDelayGroupProvider} from '../../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {PaneFooter, usePane} from '../../../components'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../constants'
import {DocumentStatusBar} from '../statusBar'
import {useDocumentPane} from '../useDocumentPane'

const DIALOG_PROVIDER_POSITION: DialogProviderProps['position'] = [
  // We use the `position: fixed` for dialogs on narrower screens (first two media breakpoints).
  'fixed',
  'fixed',
  // And we use the `position: absolute` strategy (within panes) on wide screens.
  'absolute',
]

export function DocumentLayoutFooter({
  documentPanelPortalElement,
  setFooterElement,
  setActionsBoxElement,
}: {
  documentPanelPortalElement: HTMLElement | null
  setFooterElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  setActionsBoxElement: Dispatch<SetStateAction<HTMLDivElement | null>>
}) {
  const zOffsets = useZIndex()

  const {value, isInitialValueLoading, ready, documentId, schemaType} = useDocumentPane()
  const portalElements = useMemo(
    () => ({[DOCUMENT_PANEL_PORTAL_ELEMENT]: documentPanelPortalElement}),
    [documentPanelPortalElement],
  )

  const createLinkMetadata = getSanityCreateLinkMetadata(value)
  const {startInCreateBanner: StartInCreateBanner} = useSanityCreateConfig().components ?? {}
  return (
    // These providers are added because we want the dialogs in `DocumentStatusBar` to be scoped to the document pane
    // The portal element comes from `DocumentPanel`.
    <PortalProvider __unstable_elements={portalElements}>
      <DialogProvider position={DIALOG_PROVIDER_POSITION} zOffset={zOffsets.portal}>
        <PaneFooter ref={setFooterElement} padding={1}>
          {StartInCreateBanner && (
            <ShowWhenPaneOpen>
              <StartInCreateBanner
                document={value}
                documentId={documentId}
                documentType={schemaType}
                documentReady={ready}
                isInitialValueLoading={!!isInitialValueLoading}
                panelPortalElementId={DOCUMENT_PANEL_PORTAL_ELEMENT}
              />
            </ShowWhenPaneOpen>
          )}
          <TooltipDelayGroupProvider>
            <DocumentStatusBar
              actionsBoxRef={setActionsBoxElement}
              createLinkMetadata={createLinkMetadata}
            />
          </TooltipDelayGroupProvider>
        </PaneFooter>
      </DialogProvider>
    </PortalProvider>
  )
}

/**
 * Prevents whatever is inside of it from rendering when the pane is collapsed.
 * Needed locally as DocumentLayout does lives outside PaneContext, but is provided _somewhere_ within it.
 */
function ShowWhenPaneOpen(props: {children: ReactNode}) {
  const {collapsed} = usePane()
  return collapsed ? null : props.children
}
