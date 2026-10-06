import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {UpsellDialogViewedInfo} from '../../core/studio/upsell/__telemetry__/upsell.telemetry'
import type {UpsellDataResult} from '../../core/studio/upsell/types'

/**
 * @internal
 */
export interface SingleDocReleaseUpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  handleClose: () => void
  upsellDataPromise: ObservablePromise<UpsellDataResult>
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
    panelViewed: (source: UpsellDialogViewedInfo['source']) => void
    panelDismissed: () => void
    panelPrimaryClicked: () => void
    panelSecondaryClicked: () => void
  }
}

/**
 * `null` outside `SingleDocReleaseUpsellProvider`; `useSingleDocReleaseUpsell` substitutes an
 * inert value there.
 * @internal
 */
export const SingleDocReleaseUpsellContext =
  createContext<SingleDocReleaseUpsellContextValue | null>(
    'sanity/_singletons/context/single-doc-release-upsell',
    null,
  )
