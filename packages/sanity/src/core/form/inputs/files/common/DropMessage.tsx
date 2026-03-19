import {AccessDeniedIcon, UploadIcon} from '@sanity/icons'
import {type SchemaType} from '@sanity/types'
import {Box, Inline, Text} from '@sanity/ui'

import {useTranslation} from '../../../../i18n'
import {resolveUploadAssetSources} from '../../../studio/uploads/resolveUploadAssetSources'
import {type FileLike} from '../../../studio/uploads/types'
import {useFormBuilder} from '../../../useFormBuilder'
import {sticky} from './DropMessage.css'

interface Props {
  hoveringFiles: FileLike[]
  types: SchemaType[]
}

export function DropMessage(props: Props) {
  const {hoveringFiles, types} = props
  const formBuilder = useFormBuilder()
  const acceptedFiles = hoveringFiles.filter((file) =>
    types.some((type) => resolveUploadAssetSources(type, formBuilder, file).length > 0),
  )
  const rejectedFilesCount = hoveringFiles.length - acceptedFiles.length
  const multiple = types.length > 1
  const {t} = useTranslation()
  return (
    <Box
      className={sticky}
      data-testid="upload-target-drop-message"
      paddingBottom={3}
      paddingTop={3}
    >
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
        <Inline data-testid="upload-target-drop-message-not-allowed" space={2}>
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
    </Box>
  )
}
