import {Schema, SchemaType} from '@sanity/types'
import {EMPTY, from, noop, of} from 'rxjs'
import imageUrlBuilder from '@sanity/image-url'
import React, {ComponentProps} from 'react'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {FormBuilderContext} from '../../sanity/legacyPartImplementations/form-builder'
import ImageInput, {Image} from '../../inputs/files/ImageInput'

import type {UploadOptions} from '../../sanity/uploads/types'

const resolveUploaderStub = () => ({
  priority: 1,
  type: 'image',
  accepts: 'image/*',
  upload: (file: File, type?: SchemaType, options?: UploadOptions) => EMPTY,
})

const observeAssetStub = (id: string) =>
  of({
    _id: id,
    _type: 'sanity.imageAsset' as const,
    _createdAt: '2021-06-30T08:16:55Z',
    _rev: 'x3HeExLNg9nMfqQGwLDqyZ',
    _updatedAt: '2021-06-30T08:16:55Z',
    assetId: '47b2fbcdb38bee39c02064b218b47a17de808945',
    extension: 'jpg',
    metadata: {
      _type: 'sanity.imageMetadata' as const,
      dimensions: {
        _type: 'sanity.imageDimensions' as const,
        aspectRatio: 0.75,
        height: 3648,
        width: 2736,
      },
      hasAlpha: false,
      isOpaque: true,
    },
    mimeType: 'image/jpeg',
    originalFilename: '2021-06-23 08.10.04.jpg',
    path: 'images/ppsg7ml5/test/47b2fbcdb38bee39c02064b218b47a17de808945-2736x3648.jpg',
    sha1hash: '47b2fbcdb38bee39c02064b218b47a17de808945',
    size: 4277677,
    uploadId: 'OLknm0kCxeXuzlxbcBHaRzmRWCHIbIYu',
    url:
      'https://cdn.sanity.io/images/ppsg7ml5/test/47b2fbcdb38bee39c02064b218b47a17de808945-2736x3648.jpg',
  })
const imageUrlBuilderStub = imageUrlBuilder({dataset: 'some-dataset', projectId: 'some-project-id'})

export const DEFAULT_PROPS = {
  value: {},
  compareValue: {},
  type: {
    description: '',
    fields: [],
    isCustomized: false,
    jsonType: 'object',
    name: '',
    options: {},
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
  resolveUploader: resolveUploaderStub,
  observeAsset: observeAssetStub,
  onBlur: () => undefined,
  onFocus: () => undefined,
  readOnly: false,
  focusPath: [],
  directUploads: true,
  assetSources: [{}],
  markers: [],
  presence: [],
  imageUrlBuilder: imageUrlBuilderStub,
  getValuePath: () => ['Image'],
}

// Use this in your test to get full control when testing the form builder
// the default props are available in DEFAULT_props
export const ImageInputTester = React.forwardRef(function ImageInputTester(
  props: ComponentProps<typeof ImageInput> & {schema: Schema},
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
