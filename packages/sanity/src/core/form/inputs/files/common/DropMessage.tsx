import {AccessDeniedIcon} from '@sanity/icons/AccessDenied'
import {UploadIcon} from '@sanity/icons/Upload'
import {type SchemaType} from '@sanity/types'
import {Inline} from '@sanity/ui'
import {Text, Box, Icon} from 'ui5'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
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
          <Inline gap={2}>
            <Icon icon={UploadIcon} />
            {multiple
              ? t('inputs.files.common.drop-message.drop-to-upload-multi', {
                  count: acceptedFiles.length,
                })
              : t('inputs.files.common.drop-message.drop-to-upload')}
            <Text as="div" trim={true} />
          </Inline>
          {rejectedFilesCount > 0 && (
            <Box marginTop={4}>
              <Inline gap={2}>
                <Icon muted size={1} icon={AccessDeniedIcon} />
                <Text muted size={1} as="div" trim={true}>
                  {t('inputs.files.common.drop-message.drop-to-upload.rejected-file-message', {
                    count: rejectedFilesCount,
                  })}
                </Text>
              </Inline>
            </Box>
          )}
        </>
      ) : (
        <Inline data-testid="upload-target-drop-message-not-allowed" gap={2}>
          <Icon icon={AccessDeniedIcon} />
          <Text as="div" trim={true}>
            {t('inputs.files.common.drop-message.drop-to-upload.no-accepted-file-message', {
              count: hoveringFiles.length,
            })}
          </Text>
        </Inline>
      )}
    </Box>
  )
}
