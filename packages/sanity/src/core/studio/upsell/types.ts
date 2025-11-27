import {type PortableTextBlock} from '@sanity/types'

import {type UpsellDialogViewedInfo} from './__telemetry__/upsell.telemetry'

/**
 * @beta
 * @hidden
 */
export interface UpsellData {
  _createdAt: string
  _id: string
  _rev: string
  _type: string
  _updatedAt: string
  id: string
  image: {
    asset: {
      url: string
      altText: string | null
    }
  } | null
  descriptionText: PortableTextBlock[]
  ctaButton: {
    text: string
    url: string
  }
  secondaryButton: {
    url: string
    text: string
  }
}

/**
 * @internal
 */
export interface DocumentLimitUpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  handleClose: () => void
  upsellData: UpsellData | null
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
    panelPrimaryClicked: () => void
    panelSecondaryClicked: () => void
  }
}
