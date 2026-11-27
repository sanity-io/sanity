import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Card} from '@sanity/ui'
import {useCallback} from 'react'
import {Text, Flex, Icon} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useMigrateVariantConditions} from '../hooks/useMigrateVariantConditions'
import {variantsLocaleNamespace} from '../i18n'
import {type SystemVariant} from '../types'

/**
 * Warns that `variants` still store their conditions in the legacy object shape, with an action
 * that migrates all of them. Renders nothing once none of them need migrating.
 *
 * @internal
 */
export function VariantConditionsMigrationBanner(props: {
  actionText: string
  description: string
  testId: string
  variants: SystemVariant[]
}): React.JSX.Element | null {
  const {actionText, description, testId, variants} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const {hasPermission, isMigrating, migrate} = useMigrateVariantConditions()

  const handleMigrate = useCallback(() => {
    void migrate(variants)
  }, [migrate, variants])

  if (!variants.some((variant) => variant.needsMigration)) {
    return null
  }

  return (
    <Card data-testid={testId} radius={3} paddingX={2} paddingY={2} tone="caution">
      <Flex alignItems="center" gap={3} paddingX={2}>
        <Icon size={0} style={{margin: '-0.3125rem'}} icon={WarningOutlineIcon} tone="caution" />
        <Flex alignItems="center" flexBasis="0%" flexGrow={1} gap={2} paddingY={2}>
          <Text size={1} weight="medium" as="div" trim={true} tone="caution">
            {description}
          </Text>
        </Flex>
        <Flex flexBasis="auto" flexGrow={0} flexShrink={0}>
          <Button
            data-testid={`${testId}-action`}
            disabled={hasPermission !== true || isMigrating}
            loading={isMigrating}
            mode="bleed"
            onClick={handleMigrate}
            text={actionText}
            tone="caution"
            tooltipProps={
              hasPermission === false ? {content: t('migration.permission-error')} : undefined
            }
          />
        </Flex>
      </Flex>
    </Card>
  )
}
