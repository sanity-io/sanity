import {type ObservablePromise} from 'react-rx'

import {type UpsellTelemetryLogs} from '../../../hooks/useUpsellData'
import {type UpsellDialogViewedInfo} from '../../../studio/upsell/__telemetry__/upsell.telemetry'
import {type UpsellDataResult} from '../../../studio/upsell/types'

/**
 * @internal
 */
export interface VariantsUpsellContextValue {
  upsellDialogOpen: boolean
  /** Opens the upsell dialog. Only call it in upsell mode: the dialog renders nothing otherwise. */
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  handleClose: () => void
  /**
   * The upsell content, settled once its request has answered, or `null` outside the provider.
   * Read it with `use()` in the leaf that renders the content, under a `Suspense` boundary.
   */
  upsellDataPromise: ObservablePromise<UpsellDataResult> | null
  /** Starts the content request when the provider did not preload it */
  requestUpsellData: () => void
  telemetryLogs: UpsellTelemetryLogs
}
