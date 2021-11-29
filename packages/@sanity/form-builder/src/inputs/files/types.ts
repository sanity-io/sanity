import type {ComponentType} from 'react'
import type {AssetSource, AssetSourceComponentProps} from '@sanity/types'

export interface UploadState {
  progress: number
  initiated: string
  updated: string
  file: {name: string; type: string}
}

// This is a variant of the AssetSource type used by FileInput + ImageInput
// The only difference is that it doesn't require the document to be explicitly passed as a prop to the Asset Source component
// It's purpose is to enable an optimization that allows us to not pass the document to ImageInput/FileInput
// and inflicting re-renders on every keystroke. Without it, the image and file inputs would have had to be wrapped in
// `withDocument` and as a consequence re-render on every keystrokes
export type InternalAssetSource = Omit<AssetSource, 'component'> & {
  component: ComponentType<Omit<AssetSourceComponentProps, 'document'>>
}
