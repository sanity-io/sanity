import {Box, Flex, Text} from '@sanity/ui'
import {memo} from 'react'

import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useSchema} from '../../../../hooks/useSchema'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../../../studio/workspace'
import {type CopyToDraftsOptions} from '../../../hooks/useCopyToDrafts'
import {LATEST} from '../../../util/const'
import {ReleaseAvatar} from '../../ReleaseAvatar'

interface CopyToDraftsMenuItemProps {
  documentType: string
  fromRelease: string
  onClick: (options: CopyToDraftsOptions) => Promise<void>
}

/**
 * Copy version to draft option shown as long as document type supports drafts (not live edit),
 * so long as draft mode is enabled in project, and the selected version is not draft
 */
export const useHasCopyToDraftOption = (documentType: string, fromRelease: string) => {
  const {document} = useWorkspace()
  const schema = useSchema()

  const schemaType = schema.get(documentType)
  const isLiveEdit = schemaType?.liveEdit

  const isDraftModelEnabled = document?.drafts?.enabled
  const shouldShowDraftsOption =
    isDraftModelEnabled && fromRelease !== 'draft' && fromRelease !== 'published' && !isLiveEdit

  return shouldShowDraftsOption
}

export const CopyToDraftsMenuItem = memo(function CopyToDraftsMenuItem(
  props: CopyToDraftsMenuItemProps,
) {
  const {documentType, fromRelease, onClick} = props
  const {t} = useTranslation()
  const shouldShowDraftsOption = useHasCopyToDraftOption(documentType, fromRelease)

  if (!shouldShowDraftsOption) {
    return null
  }

  return (
    <MenuItem
      as="a"
      onClick={() => void onClick({shouldConfirmDraftDiscard: true})}
      data-testid="copy-to-drafts-menu-item"
      renderMenuItem={() => (
        <Flex gap={3} align="center">
          <Box flex="none" paddingX={2}>
            <ReleaseAvatar padding={0} release={LATEST} />
          </Box>
          <Text size={1} weight="medium">
            {t('release.chip.draft')}
          </Text>
        </Flex>
      )}
    />
  )
})
