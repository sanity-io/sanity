import {Box, Flex, Text} from '@sanity/ui'
import {memo, useCallback} from 'react'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useSchema} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
import {useWorkspace} from '../../../../studio/workspace'
import {useCopyToDrafts} from '../../../hooks/useCopyToDrafts'
import {getReleaseTone} from '../../../util/getReleaseTone'
import {ReleaseAvatar} from '../../ReleaseAvatar'

interface CopyToDraftsMenuItemProps {
  documentId: string
  documentType: string
  fromRelease: string
  onClick: () => void
  onNavigate?: () => void
}

export const CopyToDraftsMenuItem = memo(function CopyToDraftsMenuItem(
  props: CopyToDraftsMenuItemProps,
) {
  const {documentId, documentType, fromRelease, onClick, onNavigate} = props
  const {t} = useTranslation()
  const {document} = useWorkspace()
  const schema = useSchema()
  const schemaType = schema.get(documentType)
  const isLiveEdit = schemaType?.liveEdit

  const isDraftModelEnabled = document?.drafts?.enabled
  const shouldShowDraftsOption = isDraftModelEnabled && fromRelease !== 'draft' && !isLiveEdit

  const {handleCopyToDrafts, hasDraftVersion} = useCopyToDrafts({
    documentId,
    fromRelease,
    onNavigate,
  })

  const handleDraftsClick = useCallback(() => {
    if (hasDraftVersion) {
      onClick()
    } else {
      handleCopyToDrafts()
    }
  }, [hasDraftVersion, onClick, handleCopyToDrafts])

  if (!shouldShowDraftsOption) {
    return null
  }

  return (
    <MenuItem
      as="a"
      onClick={handleDraftsClick}
      data-testid="copy-to-drafts-menu-item"
      renderMenuItem={() => (
        <Flex gap={3} align="center">
          <Box flex="none" paddingX={2}>
            <ReleaseAvatar padding={0} tone={getReleaseTone('drafts')} />
          </Box>
          <Text size={1} weight="medium">
            {t('release.chip.draft')}
          </Text>
        </Flex>
      )}
    />
  )
})
