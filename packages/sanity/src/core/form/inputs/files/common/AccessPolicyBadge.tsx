import {LockIcon} from '@sanity/icons/Lock'
import {Card, Flex, Text} from '@sanity/ui'
import {Box} from 'ui5'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'

export function AccessPolicyBadge(props: {hideBackground?: boolean}) {
  const {t} = useTranslation()
  const {hideBackground = false} = props

  const content = (
    <Flex align="center" justify="center" gap={2}>
      <Text size={1}>
        <LockIcon />
      </Text>
      <Text size={1} weight="medium" muted>
        {t('inputs.files.common.access-policy.private.label')}
      </Text>
    </Flex>
  )

  return (
    <Tooltip content={t('inputs.files.common.access-policy.private.tooltip')}>
      {hideBackground ? (
        <Box padding={2}>{content}</Box>
      ) : (
        <Card tone="neutral" radius={2} padding={2} muted>
          {content}
        </Card>
      )}
    </Tooltip>
  )
}
