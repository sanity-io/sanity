import React from 'react'
import {SchemaType} from '@sanity/types'
import {Box, Text, Inline} from '@sanity/ui'
import {AccessDeniedIcon, UploadIcon} from '@sanity/icons'
import {FileLike, UploaderResolver} from '../../../studio/uploads/types'
import {useTranslation} from '../../../../i18n'

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
                  {rejectedFilesCount} file
                  {rejectedFilesCount > 1 ? 's' : ''} can't be uploaded here
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
            Can't upload {hoveringFiles.length > 1 ? 'any of these files' : 'this file'} here
          </Text>
        </Inline>
      )}
    </>
  )
}
