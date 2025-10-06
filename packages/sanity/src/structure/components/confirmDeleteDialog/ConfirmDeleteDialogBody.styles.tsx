import {InfoOutlineIcon} from '@sanity/icons'
import {Box, Flex, Inline, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'

import {Tooltip} from '../../../ui-components'
import {structureLocaleNamespace} from '../../i18n'
import * as styles from '../../Structure.css'

// Re-export the styles for backward compatibility
export const ChevronWrapper = Box
export const CrossDatasetReferencesDetails = 'details'
export const CrossDatasetReferencesSummary = 'summary'
export const Table = 'table'
export const DocumentIdFlex = Flex

export const OtherReferenceCount = (props: {totalCount: number; references: unknown[]}) => {
  const {t} = useTranslation(structureLocaleNamespace)
  const difference = props.totalCount - props.references.length

  if (!difference) return null

  return (
    <Box padding={2}>
      <Inline gap={2}>
        <Text size={1} muted>
          {t('confirm-delete-dialog.other-reference-count.title', {count: difference})}
        </Text>

        <Tooltip
          portal
          placement="top"
          content={t('confirm-delete-dialog.other-reference-count.tooltip')}
        >
          <Text size={1} muted>
            <InfoOutlineIcon />
          </Text>
        </Tooltip>
      </Inline>
    </Box>
  )
}
