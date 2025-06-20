import {DialogProvider, type DialogProviderProps, PortalProvider} from '@sanity/ui'
import {type Dispatch, type SetStateAction, useMemo} from 'react'
import {getSanityCreateLinkMetadata, useZIndex} from 'sanity'

import {TooltipDelayGroupProvider} from '../../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {PaneFooter} from '../../../components/pane/PaneFooter'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../constants'
import {DocumentStatusBar} from '../statusBar/DocumentStatusBar'
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

  const {value} = useDocumentPane()
  const portalElements = useMemo(
    () => ({[DOCUMENT_PANEL_PORTAL_ELEMENT]: documentPanelPortalElement}),
    [documentPanelPortalElement],
  )

  const createLinkMetadata = getSanityCreateLinkMetadata(value)
  return (
    // These providers are added because we want the dialogs in `DocumentStatusBar` to be scoped to the document pane
    // The portal element comes from `DocumentPanel`.
    <PortalProvider __unstable_elements={portalElements}>
      <DialogProvider position={DIALOG_PROVIDER_POSITION} zOffset={zOffsets.portal}>
        <PaneFooter ref={setFooterElement} padding={1}>
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
