import {Card} from '@sanity/ui'
import {get} from 'lodash'
import {memo, useMemo} from 'react'

import {UploadPlaceholder} from '../common/UploadPlaceholder'
import {type BaseImageInputProps, type FileInfo} from './types'

function ImageInputUploadPlaceholderComponent(props: {
  directUploads: boolean | undefined
  handleSelectFiles: (files: File[]) => void
  hoveringFiles: FileInfo[]
  readOnly: boolean | undefined
  renderBrowser(): React.JSX.Element | null
  resolveUploader: BaseImageInputProps['resolveUploader']
  schemaType: BaseImageInputProps['schemaType']
}) {
  const {
    directUploads,
    handleSelectFiles,
    hoveringFiles,
    readOnly,
    renderBrowser,
    resolveUploader,
    schemaType,
  } = props

  const acceptedFiles = useMemo(
    () => hoveringFiles.filter((file) => resolveUploader(schemaType, file)),
    [hoveringFiles, resolveUploader, schemaType],
  )
  const accept = useMemo(() => get(schemaType, 'options.accept', 'image/*'), [schemaType])

  const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length

  return (
    <div style={{padding: 1}}>
      <Card
        tone={readOnly ? 'transparent' : 'inherit'}
        border
        paddingX={3}
        paddingY={2}
        radius={2}
        style={hoveringFiles.length === 0 ? {} : {borderColor: 'transparent'}}
      >
        <UploadPlaceholder
          browse={renderBrowser()}
          onUpload={handleSelectFiles}
          readOnly={readOnly}
          hoveringFiles={hoveringFiles}
          acceptedFiles={acceptedFiles}
          rejectedFilesCount={rejectedFilesCount}
          type="image"
          accept={accept}
          directUploads={directUploads}
        />
      </Card>
    </div>
  )
}
export const ImageInputUploadPlaceholder = memo(ImageInputUploadPlaceholderComponent)
