import {CommentsUpsellData} from '../../types'

export interface CommentsUpsellContextValue {
  upsellDialogOpen: boolean
  setUpsellDialogOpen: (open: boolean) => void
  upsellData: CommentsUpsellData | null
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
    panelViewed: (source: 'document_action' | 'field_action' | 'link') => void
    panelDismissed: () => void
    panelPrimaryClicked: () => void
    panelSecondaryClicked: () => void
  }
}
