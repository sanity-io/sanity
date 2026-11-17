import {LockIcon} from '@sanity/icons/Lock'
import {Card} from '@sanity/ui'
import {Text, Flex, Box, Icon} from 'ui5'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'

export function AccessPolicyBadge(props: {hideBackground?: boolean}) {
  const {t} = useTranslation()
  const {hideBackground = false} = props

  const content = (
    <Flex alignItems="center" justifyContent="center" gap={2}>
      <Icon size={1} muted icon={LockIcon} style={{margin: '-0.375rem'}} />
      <Text size={1} weight="medium" muted as="div" trim={true}>
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
