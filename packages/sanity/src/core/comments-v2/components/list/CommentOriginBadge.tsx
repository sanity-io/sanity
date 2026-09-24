import {Card, Text} from '@sanity/ui'
import {Flex} from 'ui5'

import {CircleSmallIcon} from '../../../components/temporary-icons/CircleSmall'
import {RingIcon} from '../../../components/temporary-icons/Ring'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {commentsLocaleNamespace} from '../../i18n'
import {iconSlotRoot} from './CommentOriginBadge.css'

export type CommentOrigin = 'draft' | 'published'

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
          <div className={iconSlotRoot} data-status={origin}>
            <Text size={2}>{origin === 'draft' ? <RingIcon /> : <CircleSmallIcon />}</Text>
          </div>

          <Text size={0} muted weight="medium">
            {t(getOriginI18nKey(origin))}
          </Text>
        </Flex>
      </Card>
    </Flex>
  )
}
