import {CommentsUpsellData} from '../../types'

export interface CommentsUpsellContextValue {
  upsellDialogOpen: boolean
  setUpsellDialogOpen: (open: boolean) => void
  upsellData: CommentsUpsellData | null
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
    panelPrimaryClicked: () => void
    panelSecondaryClicked: () => void
  }
}
