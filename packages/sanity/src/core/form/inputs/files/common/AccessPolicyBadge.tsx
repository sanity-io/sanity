import {LockIcon} from '@sanity/icons'
import {Box, Card, Flex, Text} from '@sanity/ui'

import {Tooltip} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'

export function AccessPolicyBadge(props: {hideBackground?: boolean}) {
  const {t} = useTranslation()
  const {hideBackground = false} = props

  const Wrapper = hideBackground ? Box : Card

  return (
    <Tooltip content={t('inputs.files.common.access-policy.private.tooltip')}>
      <Wrapper tone="neutral" radius={2} padding={2} muted>
        <Flex align="center" justify="center" gap={2}>
          <Text size={1}>
            <LockIcon />
          </Text>
          <Text size={1} weight="medium" muted>
            {t('inputs.files.common.access-policy.private.label')}
          </Text>
        </Flex>
      </Wrapper>
    </Tooltip>
  )
}
