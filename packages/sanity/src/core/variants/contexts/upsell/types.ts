/**
 * @internal
 */
export interface VariantsUpsellContextValue {
  upsellDialogOpen: boolean
  /** Opens the upsell dialog. Only call it in upsell mode: the dialog renders nothing otherwise. */
  handleOpenDialog: () => void
  handleClose: () => void
}
