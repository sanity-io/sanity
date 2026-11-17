import {AvatarStack} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {useMemo} from 'react'
import {css, styled} from 'styled-components'

import {Tooltip, type TooltipProps} from '../../ui-components/tooltip/Tooltip'
import {UserAvatar} from '../components/userAvatar/UserAvatar'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {type DocumentPresence} from '../store/presence/types'
import {getVersionFromId} from '../util/draftUtils'
import {isNonNullable} from '../util/isNonNullable'

/** @internal */
export interface DocumentPreviewPresenceProps {
  presence: Omit<DocumentPresence, 'path'>[]
}

/**
 * The tooltip opens to the left of the avatars, over its own row's title, so it never covers the
 * next row in a document list. Above or below only when there is no room on the left.
 */
const PRESENCE_MENU_POPOVER_PROPS: TooltipProps = {
  fallbackPlacements: ['top', 'bottom'],
  placement: 'left',
  portal: true,
}

const AvatarStackBox = styled.div((props) => {
  const {space} = getTheme_v2(props.theme)

  return css`
    margin: ${0 - space[1]}px;
  `
})

/** @internal */
export function DocumentPreviewPresence(props: DocumentPreviewPresenceProps) {
  const {presence} = props
  // Previews render in every studio, with or without the releases plugin, so these strings live
  // in the always registered `studio` namespace
  const {t} = useTranslation()

  const {data: releases} = useActiveReleases()

  const uniquePresence = useMemo(
    () =>
      Array.from(new Set(presence.map((a) => a.user.id)))
        .map((id) => {
          return presence.find((a) => a.user.id === id)
        })
        .filter(isNonNullable),
    [presence],
  )

  const tooltipContent = useMemo(() => {
    if (uniquePresence.length === 1) {
      const firstPresence = uniquePresence[0]
      const documentId = firstPresence?.documentId
      const versionId = documentId ? getVersionFromId(documentId) : undefined
      const displayName = firstPresence.user.displayName

      if (!versionId) {
        return t('presence.tooltip.one-without-release', {displayName})
      }

      const release = releases.find((r) => getReleaseIdFromReleaseDocumentId(r._id) === versionId)
      const releaseTitle = release?.metadata?.title
      return t('presence.tooltip.one', {
        displayName,
        releaseTitle: releaseTitle || t('presence.tooltip.untitled-release'),
      })
    }

    if (uniquePresence.length > 1) {
      return t('presence.tooltip.other', {count: uniquePresence.length})
    }

    return undefined
  }, [releases, t, uniquePresence])

  return (
    <Tooltip content={tooltipContent} {...PRESENCE_MENU_POPOVER_PROPS}>
      <AvatarStackBox>
        <AvatarStack maxLength={2} aria-label={tooltipContent} size={0}>
          {uniquePresence.map((item) => (
            // The tooltip and the stack's `aria-label` name everyone, so each avatar leaves out the
            // browser's own name tooltip, which would show as a third layer over the row
            <UserAvatar hideTitle key={item.user.id} size={0} user={item.user} />
          ))}
        </AvatarStack>
      </AvatarStackBox>
    </Tooltip>
  )
}
