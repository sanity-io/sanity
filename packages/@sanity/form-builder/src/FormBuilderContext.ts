import {AssetSource, Path, Schema, SchemaType} from '@sanity/types'
import React, {createContext} from 'react'
import {PatchChannel} from './patchChannel'

export interface FormBuilderContextValue {
  // @todo: fix prop typings
  components: {
    ArrayFunctions: React.ComponentType<any>
    CustomMarkers?: React.ComponentType<any>
    Markers: React.ComponentType<any>
    inputs: {
      array?: React.ComponentType<any>
      boolean?: React.ComponentType<any>
      date?: React.ComponentType<any>
      datetime?: React.ComponentType<any>
      email?: React.ComponentType<any>
      file?: React.ComponentType<any>
      geopoint?: React.ComponentType<any>
      image?: React.ComponentType<any>
      number?: React.ComponentType<any>
      object?: React.ComponentType<any>
      reference?: React.ComponentType<any>
      slug?: React.ComponentType<any>
      string?: React.ComponentType<any>
      text?: React.ComponentType<any>
      url?: React.ComponentType<any>

      crossDatasetReference?: React.ComponentType<any>
    }
  }
  file: {
    assetSources: AssetSource[]
    directUploads: boolean
  }
  image: {
    assetSources: AssetSource[]
    directUploads: boolean
  }
  getValuePath: () => Path
  /**
   * @internal
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase
  filterField: () => void
  schema: Schema
  resolveInputComponent: (type: SchemaType) => React.ComponentType<any>
  resolvePreviewComponent: (type: SchemaType) => React.ComponentType<any>
  getDocument: () => unknown
}

export const FormBuilderContext = createContext<FormBuilderContextValue | null>(null)
