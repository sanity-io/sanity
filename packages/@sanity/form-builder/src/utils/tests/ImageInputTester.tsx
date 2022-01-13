import {FormFieldPresence} from '@sanity/base/presence'
import {ImageSchemaType, Schema, Marker, Path, SanityDocument} from '@sanity/types'
import {noop, Observable} from 'rxjs'
import imageUrlBuilder from '@sanity/image-url'
import React from 'react'
import {ThemeProvider, studioTheme, LayerProvider, ToastProvider} from '@sanity/ui'
import {InternalAssetSource} from '../../inputs/files/types'
import {FormBuilderContext, PatchEvent} from '../../sanity/legacyPartImplementations/form-builder'
import {UploaderResolver} from '../../sanity/uploads/types'
import ImageInput, {Image} from '../../inputs/files/ImageInput'

import {materializeReference} from '../../sanity/inputs/client-adapters/assets'
import {versionedClient} from '../../sanity/versionedClient'

export const DEFAULT_PROPS = {
  value: {},
  compareValue: {},
  type: {
    description: '',
    fields: [],
    isCustomized: false,
    jsonType: 'object',
    name: '',
    options: {hotspot: true},
    preview: {},
    title: '',
    type: {
      jsonType: 'object',
      name: 'image',
      type: null,
    },
  },
  level: 1,
  onChange: () => undefined,
  resolveUploader: null,
  materialize: materializeReference,
  onBlur: () => undefined,
  onFocus: () => undefined,
  readOnly: false,
  focusPath: [],
  directUploads: true,
  assetSources: [{}],
  markers: [],
  presence: [],
  imageToolBuilder: imageUrlBuilder(versionedClient),
  getValuePath: () => ['Image'],
}

export type ImageInputProps = {
  value: Image
  compareValue?: Image
  type: ImageSchemaType
  level: number
  onChange: (event: PatchEvent) => void
  resolveUploader: UploaderResolver
  materialize: (documentId: string) => Observable<SanityDocument>
  onBlur: () => void
  onFocus: (path: Path) => void
  readOnly: boolean | null
  focusPath: Path
  directUploads?: boolean
  assetSources?: InternalAssetSource[]
  markers: Marker[]
  presence: FormFieldPresence[]
  imageToolBuilder?: ReturnType<typeof imageUrlBuilder>
  getValuePath: () => Path
  schema: Schema
}

// Use this in your test to get full control when testing the form builder
// the default props are available in DEFAULT_props
export const ImageInputTester = React.forwardRef(function ImageInputTester(
  props: ImageInputProps,
  ref
) {
  const {schema, ...rest} = props
  return (
    <ThemeProvider scheme="light" theme={studioTheme}>
      <LayerProvider>
        <ToastProvider>
          <FormBuilderContext value={undefined} patchChannel={{onPatch: noop}} schema={schema}>
            <ImageInput {...rest} />
          </FormBuilderContext>
        </ToastProvider>
      </LayerProvider>
    </ThemeProvider>
  )
})
