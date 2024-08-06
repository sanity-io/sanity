import {type BundleDocument} from '../../store/bundles/types'

export type AtLeastOneBundle = [BundleDocument, ...BundleDocument[]]

export const containsBundles = (bundles: BundleDocument[]): bundles is AtLeastOneBundle =>
  !!bundles.length
