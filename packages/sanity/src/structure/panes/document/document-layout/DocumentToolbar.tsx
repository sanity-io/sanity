import {DialogProvider, type DialogProviderProps, PortalProvider} from '@sanity/ui'
import {type Dispatch, type Ref, type SetStateAction, useMemo} from 'react'
import {useZIndex} from 'sanity'

import {TooltipDelayGroupProvider} from '../../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {PaneFooter} from '../../../components/pane/PaneFooter'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../constants'
import {
  type DocumentActionsPlacement,
  DocumentActionsPlacementProvider,
} from '../statusBar/documentActionsPlacement'
import {DocumentStatusBar} from '../statusBar/DocumentStatusBar'
import {type DocumentToolbarSlots} from './documentToolbarSlots'

const DIALOG_PROVIDER_POSITION: DialogProviderProps['position'] = [
  // We use the `position: fixed` for dialogs on narrower screens (first two media breakpoints).
  'fixed',
  'fixed',
  // And we use the `position: absolute` strategy (within panes) on wide screens.
  'absolute',
]

interface DocumentToolbarProps {
  documentPanelPortalElement: HTMLElement | null
  placement: DocumentActionsPlacement
  ref?: Ref<HTMLDivElement>
  setActionsBoxElement: Dispatch<SetStateAction<HTMLDivElement | null>>
  slots?: DocumentToolbarSlots
}

export function DocumentToolbar(props: DocumentToolbarProps) {
  const {documentPanelPortalElement, placement, ref, setActionsBoxElement, slots} = props
  const zOffsets = useZIndex()

  const portalElements = useMemo(
    () => ({[DOCUMENT_PANEL_PORTAL_ELEMENT]: documentPanelPortalElement}),
    [documentPanelPortalElement],
  )

  const statusBar = (
    <TooltipDelayGroupProvider>
      <DocumentStatusBar actionsBoxRef={setActionsBoxElement} placement={placement} slots={slots} />
    </TooltipDelayGroupProvider>
  )

  return (
    // These providers are added because we want the dialogs in `DocumentStatusBar` to be scoped to the document pane
    // The portal element comes from `DocumentPanel`.
    <PortalProvider __unstable_elements={portalElements}>
      <DialogProvider position={DIALOG_PROVIDER_POSITION} zOffset={zOffsets.portal}>
        <DocumentActionsPlacementProvider placement={placement}>
          {placement === 'top' ? (
            <div data-testid="document-toolbar" ref={ref}>
              {statusBar}
            </div>
          ) : (
            <PaneFooter ref={ref} padding={1}>
              {statusBar}
            </PaneFooter>
          )}
        </DocumentActionsPlacementProvider>
      </DialogProvider>
    </PortalProvider>
  )
}
