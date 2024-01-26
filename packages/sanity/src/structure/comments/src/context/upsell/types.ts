import {CommentsUpsellData} from '../../types'

export interface CommentsUpsellContextValue {
  upsellDialogOpen: boolean
  setUpsellDialogOpen: (open: boolean) => void
  upsellData: CommentsUpsellData | null
}
