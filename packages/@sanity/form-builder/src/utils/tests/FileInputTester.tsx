import {Schema, SchemaType} from '@sanity/types'
import {EMPTY, of} from 'rxjs'
import imageUrlBuilder from '@sanity/image-url'
import React, {ComponentProps, useMemo} from 'react'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {FormBuilderProvider} from '../../sanity/legacyPartImplementations/form-builder'
import FileInput from '../../inputs/files/FileInput'

import type {UploadOptions} from '../../sanity/uploads/types'
import {createPatchChannel} from '../../patchChannel'

const resolveUploaderStub = () => ({
  priority: 1,
  type: 'file',
  accepts: 'file/*',
  upload: (file: File, type?: SchemaType, options?: UploadOptions) => EMPTY,
})

const observeAssetStub = (id: string) =>
  of({
    originalFilename: 'cats.txt',
    url: 'https://cdn.sanity.io/files/ppsg7ml5/test/26db46ec62059d6cd491b4343afaecc92ff1b4d5.txt',
    size: 31,
    _id: 'file-26db46ec62059d6cd491b4343afaecc92ff1b4d5-txt',
    _rev: 'slQurnjRhOy7Fj3dkfUHei',
    _type: 'sanity.fileAsset',
  })
const imageUrlBuilderStub = imageUrlBuilder({dataset: 'some-dataset', projectId: 'some-project-id'})

export const DEFAULT_PROPS = {
  value: {},
  compareValue: {},
  type: {
    description: '',
    fields: [
      {
        name: 'asset',
        type: {
          fields: [],
          jsonType: 'object',
          name: 'reference',
          title: 'Reference to file',
          to: [],
          type: {name: 'reference', type: null, jsonType: 'object', validation: []},
          validation: [],
        },
      },
    ],
    isCustomized: false,
    jsonType: 'object',
    name: '',
    options: {},
    preview: {},
    title: '',
    type: {
      jsonType: 'object',
      name: 'file',
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
  getValuePath: () => ['File'],
}

// Use this in your test to get full control when testing the form builder
// the default props are available in DEFAULT_props
export const FileInputTester = React.forwardRef(function ImageInputTester(
  props: ComponentProps<typeof FileInput> & {schema: Schema},
  ref
) {
  const {schema, ...rest} = props
  const patchChannel = useMemo(() => createPatchChannel(), [])

  return (
    <ThemeProvider scheme="light" theme={studioTheme}>
      <LayerProvider>
        <ToastProvider>
          <FormBuilderProvider
            value={undefined}
            __internal_patchChannel={patchChannel}
            schema={schema}
          >
            <FileInput {...rest} />
          </FormBuilderProvider>
        </ToastProvider>
      </LayerProvider>
    </ThemeProvider>
  )
})
