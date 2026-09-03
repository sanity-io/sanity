import {SearchIcon} from '@sanity/icons/Search'
import {TrashIcon} from '@sanity/icons/Trash'
import {
  defineField,
  defineType,
  type FileSchemaType,
  type ImageSchemaType,
  type ObjectSchemaType,
  type UploadState,
} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type CSSProperties, useRef} from 'react'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../ui-components/button/Button'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useSchema} from '../../../../hooks/useSchema'
import {PlaceholderText} from '../common/PlaceholderText'
import {UploadPlaceholder} from '../common/UploadPlaceholder'
import {UploadProgress} from '../common/UploadProgress'
import {FileActionsMenu} from '../FileInput/FileActionsMenu'
import {FileSkeleton} from '../FileInput/FileSkeleton'
import {ImageInputUploadPlaceholder} from '../ImageInput/ImageInputUploadPlaceholder'
import {ImagePreview} from '../ImageInput/ImagePreview'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({type: 'image', name: 'photo', title: 'Photo'}),
      defineField({type: 'file', name: 'attachment', title: 'Attachment'}),
    ],
  }),
]

const NO_ASSET_SOURCES: never[] = []
const HOVERING_FILES = [{name: 'notes.txt', type: 'text/plain'}]

const UPLOAD_STATE: UploadState = {
  progress: 42,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  file: {name: 'holiday-photos-from-the-mountains-final-version.jpg', type: 'image/jpeg'},
}

// Dimensions the image input derives from the asset; the ratio box reads them as CSS variables.
const IMAGE_DIMENSIONS = {'--image-width': 1200, '--image-height': 800} as CSSProperties
// Undecodable image data makes the <img> error out synchronously, which with an
// unknown access policy renders the access-restriction overlay.
const BROKEN_IMAGE_SRC = 'data:image/png;base64,broken'

function renderBrowse() {
  return <Button icon={SearchIcon} mode="bleed" text="Browse" />
}

function FileRow(props: {accessPolicy?: 'public' | 'private'; disabled?: boolean}) {
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)

  return (
    <Card border radius={2} style={{padding: 1}} tone={props.disabled ? 'transparent' : 'inherit'}>
      <FileActionsMenu
        accessPolicy={props.accessPolicy}
        disabled={props.disabled}
        isMenuOpen={false}
        menuButtonRef={menuButtonRef}
        muted={!props.disabled}
        onMenuOpen={noop}
        originalFilename="quarterly-report-2024.pdf"
        size={1_258_291}
      >
        <MenuItem icon={TrashIcon} text="Clear field" tone="critical" />
      </FileActionsMenu>
    </Card>
  )
}

function UploadChrome() {
  const schema = useSchema()
  const documentType = schema.get('test') as ObjectSchemaType
  const imageType = documentType.fields[0].type as ImageSchemaType
  const fileType = documentType.fields[1].type as FileSchemaType

  return (
    <Card padding={4} style={{maxWidth: 640}}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            image placeholder (row layout at 440px and up)
          </Text>
          <ImageInputUploadPlaceholder
            assetSources={NO_ASSET_SOURCES}
            directUploads
            onSelectFile={noop}
            readOnly={false}
            renderBrowser={renderBrowse}
            schemaType={imageType}
          />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            browse only (disableNew)
          </Text>
          <ImageInputUploadPlaceholder
            assetSources={NO_ASSET_SOURCES}
            directUploads
            disableNew
            onSelectFile={noop}
            readOnly={false}
            renderBrowser={renderBrowse}
            schemaType={imageType}
          />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            file placeholder collapsed below 440px
          </Text>
          <div style={{maxWidth: 360}}>
            <Card border paddingX={3} paddingY={2} radius={2}>
              <UploadPlaceholder
                assetSources={NO_ASSET_SOURCES}
                browse={renderBrowse()}
                directUploads
                schemaType={fileType}
                type="file"
              />
            </Card>
          </div>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            placeholder text (read-only, uploads disabled, rejected drop)
          </Text>
          <Card border paddingX={3} paddingY={3} radius={2} tone="transparent">
            <PlaceholderText readOnly type="image" />
          </Card>
          <Card border paddingX={3} paddingY={3} radius={2}>
            <PlaceholderText directUploads={false} type="file" />
          </Card>
          <Card border paddingX={3} paddingY={3} radius={2}>
            <PlaceholderText
              directUploads
              hoveringFiles={HOVERING_FILES}
              rejectedFilesCount={2}
              type="image"
            />
          </Card>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            upload progress
          </Text>
          <UploadProgress onCancel={noop} uploadState={UPLOAD_STATE} />
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            file asset row (editable, private read-only) and skeleton
          </Text>
          <FileRow />
          <FileRow accessPolicy="private" disabled />
          <Card border radius={2}>
            <FileSkeleton />
          </Card>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            image preview access warning
          </Text>
          <ImagePreview
            accessPolicy="unknown"
            alt=""
            border
            radius={2}
            src={BROKEN_IMAGE_SRC}
            style={IMAGE_DIMENSIONS}
          />
        </Stack>
      </Stack>
    </Card>
  )
}

/**
 * Chromatic sentinel for the file and image upload chrome after the ui5 Flex
 * migration. `UploadPlaceholder` switches from a row to a stacked column
 * below 440px, so it renders once wide and once in a 360px column; the
 * browse-only card right-aligns its button; `UploadProgress` splits its
 * 60% left section from the cancel button; the file row keeps icon, name,
 * size, badge and options button on one line; `ImagePreview` centers its
 * access-restriction overlay. Copy comes from the default studio locale; the
 * progress timestamp is fixed and never rendered.
 */
export function UploadChromeStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <UploadChrome />
    </TestWrapper>
  )
}
