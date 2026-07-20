import {DiamondIcon} from '@sanity/icons/Diamond'
import {Card, Flex, Text} from '@sanity/ui'

import {Button} from '../../../../ui-components/button'
import {RelativeTime} from '../../../components'
import {useTranslation} from '../../../i18n'
import {variantsLocaleNamespace} from '../../i18n'
import {type SystemVariant} from '../../types'
import {VariantDetailMenuButton} from './VariantDetailMenuButton'

export function VariantDetailFooter({
  openEditDialog,
  documentCount,
  documentsLoading = false,
  variant,
}: {
  openEditDialog: () => void
  documentCount: number
  documentsLoading?: boolean
  variant: SystemVariant
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)

  return (
    <Card flex="none">
      <Card borderTop marginX={2} style={{opacity: 0.6}} />

      <Flex padding={3}>
        <Flex flex={1} gap={1}>
          <Card>
            <Flex align="center" gap={2}>
              <Text size={1}>
                <DiamondIcon />
              </Text>
              <Text muted size={1}>
                {t('detail.footer.created')}{' '}
                <RelativeTime time={variant._createdAt} useTemporalPhrase minimal />
              </Text>
            </Flex>
          </Card>
        </Flex>

        <Flex flex="none" gap={1} data-testid="variant-detail-footer-actions">
          <Button onClick={openEditDialog} text={t('detail.action.edit-variant')} />
          <VariantDetailMenuButton
            documentCount={documentCount}
            documentsLoading={documentsLoading}
            variant={variant}
          />
        </Flex>
      </Flex>
    </Card>
  )
}
