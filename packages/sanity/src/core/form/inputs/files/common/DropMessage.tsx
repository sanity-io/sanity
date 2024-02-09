import {AccessDeniedIcon, UploadIcon} from '@sanity/icons'
import {type SchemaType} from '@sanity/types'
import {Box, Inline, Text} from '@sanity/ui'

import {useTranslation} from '../../../../i18n'
import {type FileLike, type UploaderResolver} from '../../../studio/uploads/types'

interface Props {
  hoveringFiles: FileLike[]
  types: SchemaType[]
  resolveUploader: UploaderResolver
}

export function DropMessage(props: Props) {
  const {hoveringFiles, types, resolveUploader} = props
  const acceptedFiles = hoveringFiles.filter((file) =>
    types.some((type) => resolveUploader(type, file)),
  )
  const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length
  const multiple = types.length > 1
  const {t} = useTranslation()
  return (
    <>
      {acceptedFiles.length > 0 ? (
        <>
          <Inline space={2}>
            <Text>
              <UploadIcon />
            </Text>
            {multiple
              ? t('inputs.files.common.drop-message.drop-to-upload-multi', {
                  count: acceptedFiles.length,
                })
              : t('inputs.files.common.drop-message.drop-to-upload')}
            <Text />
          </Inline>
          {rejectedFilesCount > 0 && (
            <Box marginTop={4}>
              <Inline space={2}>
                <Text muted size={1}>
                  <AccessDeniedIcon />
                </Text>
                <Text muted size={1}>
                  {t('inputs.files.common.drop-message.drop-to-upload.rejected-file-message', {
                    count: rejectedFilesCount,
                  })}
                </Text>
              </Inline>
            </Box>
          )}
        </>
      ) : (
        <Inline space={2}>
          <Text>
            <AccessDeniedIcon />
          </Text>
          <Text>
            {t('inputs.files.common.drop-message.drop-to-upload.no-accepted-file-message', {
              count: hoveringFiles.length,
            })}
          </Text>
        </Inline>
      )}
    </>
  )
}
