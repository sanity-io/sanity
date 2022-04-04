import {AssetSource, AssetSourceComponentProps} from '@sanity/types'
import type {ComponentType} from 'react'
import {withDocument} from '../../utils/withDocument'

export interface AssetSourceWithDocument extends Omit<AssetSource, 'component'> {
  component: ComponentType<Omit<AssetSourceComponentProps, 'document'>>
}

// Note: The asset source plugin should receive the enclosing document by default.
// Passing the current document to the Image/File inputs will make these re-render on every
// change (e.g. keypress). Wrapping the asset source component using the `withDoocument`-HOC "up-front"
// makes sure we only re-render the asset source component
export function wrapWithDocument(assetSource: AssetSource): AssetSourceWithDocument {
  return {
    ...assetSource,
    component: withDocument(assetSource.component),
  }
}
