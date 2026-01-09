import {LockIcon} from '@sanity/icons'
import {Card, Flex, Inline, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {Tooltip} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {type AssetAccessPolicy} from './types'

export const Wrapper = styled(Inline)`
  position: absolute;
  top: 0;
  left: 0;
`

export function ImageAccessPolicy(props: {accessPolicy: AssetAccessPolicy}) {
  const {accessPolicy} = props
  const {t} = useTranslation()

  if (accessPolicy === 'private') {
    return (
      <Wrapper padding={2}>
        <Tooltip content={t('inputs.image.access-policy.private.tooltip')}>
          <Card tone="neutral" radius={2} padding={2} border>
            <Flex align="center" justify="center" gap={2}>
              <Text size={1}>
                <LockIcon />
              </Text>
              <Text size={1} weight="medium" muted>
                {t('inputs.image.access-policy.private.label')}
              </Text>
            </Flex>
          </Card>
        </Tooltip>
      </Wrapper>
    )
  }
  return null
}
