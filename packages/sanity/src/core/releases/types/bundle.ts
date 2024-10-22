import {type ReleaseDocument} from '../../store/release/types'

export type AtLeastOneBundle = [ReleaseDocument, ...ReleaseDocument[]]

export const containsBundles = (bundles: ReleaseDocument[]): bundles is AtLeastOneBundle =>
  !!bundles.length
