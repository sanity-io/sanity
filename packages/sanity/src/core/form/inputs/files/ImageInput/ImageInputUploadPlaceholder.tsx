import {type AssetSource} from '@sanity/types'
import {Card} from '@sanity/ui'
import {memo, useCallback} from 'react'

import {UploadPlaceholder} from '../common/UploadPlaceholder'
import {type BaseImageInputProps} from './types'

function ImageInputUploadPlaceholderComponent(props: {
  assetSources: BaseImageInputProps['assetSources']
  directUploads: boolean | undefined
  disableNew?: boolean
  onSelectFile: (assetSource: AssetSource, file: File) => void
  readOnly: boolean | undefined
  renderBrowser(): React.JSX.Element | null
  schemaType: BaseImageInputProps['schemaType']
}) {
  const {
    assetSources,
    directUploads,
    disableNew,
    onSelectFile,
    readOnly,
    renderBrowser,
    schemaType,
  } = props

  const handleOnUpload = useCallback(
    (assetSource: AssetSource, files: File[]) => {
      onSelectFile(assetSource, files[0])
    },
    [onSelectFile],
  )

  return (
    <div style={{padding: 1}}>
      <Card tone={readOnly ? 'transparent' : 'inherit'} border paddingX={3} paddingY={2} radius={2}>
        {disableNew ? (
          renderBrowser()
        ) : (
          <UploadPlaceholder
            assetSources={assetSources}
            browse={renderBrowser()}
            directUploads={directUploads}
            onUpload={handleOnUpload}
            schemaType={schemaType}
            readOnly={readOnly}
            type="image"
          />
        )}
      </Card>
    </div>
  )
}
export const ImageInputUploadPlaceholder = memo(ImageInputUploadPlaceholderComponent)
