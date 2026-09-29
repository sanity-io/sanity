import {Card} from '@sanity/ui'
import {styled} from 'styled-components'
import {Text, Flex, Icon} from 'ui5'

import {CircleSmallIcon} from '../../../components/temporary-icons/CircleSmall'
import {RingIcon} from '../../../components/temporary-icons/Ring'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {commentsLocaleNamespace} from '../../i18n'

export type CommentOrigin = 'draft' | 'published'

/**
 * Centers draft/published status glyphs beside the origin label. Draft and
 * published slots set `--icon-color` on the root from card badge dot
 * tokens (same as `DocumentVersionsStatusIndicator`). Glyphs use ui5
 * `Icon size={2}`, not v4 `Text` descendant icon sizing.
 */
const IconSlotRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &[data-status='published'] {
    --card-icon-color: var(--card-badge-positive-dot-color);
    --icon-color: var(--card-badge-positive-dot-color);
  }
  &[data-status='draft'] {
    --card-icon-color: var(--card-badge-caution-dot-color);
    --icon-color: var(--card-badge-caution-dot-color);
  }
`

function getOriginI18nKey(origin: CommentOrigin) {
  switch (origin) {
    case 'draft':
      return 'list-item.origin.draft'
    case 'published':
      return 'list-item.origin.published'
    default:
      origin satisfies never
      return origin
  }
}

export function CommentOriginBadge({origin}: {origin: CommentOrigin}) {
  const {t} = useTranslation(commentsLocaleNamespace)

  return (
    <Flex marginBottom={2}>
      <Card border padding={1} radius={3}>
        <Flex alignItems="center" gap={1} paddingRight={1}>
          <IconSlotRoot data-status={origin}>
            <Icon icon={origin === 'draft' ? RingIcon : CircleSmallIcon} size={2} />
          </IconSlotRoot>

          <Text size={0} muted weight="medium" as="div" trim={true}>
            {t(getOriginI18nKey(origin))}
          </Text>
        </Flex>
      </Card>
    </Flex>
  )
}
