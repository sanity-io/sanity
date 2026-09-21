import {AvatarStack, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useMemo} from 'react'

import {Tooltip, type TooltipProps} from '../../ui-components/tooltip/Tooltip'
import {UserAvatar} from '../components/userAvatar/UserAvatar'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {releasesLocaleNamespace} from '../releases/i18n'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {type DocumentPresence} from '../store/presence/types'
import {getVersionFromId} from '../util/draftUtils'
import {isNonNullable} from '../util/isNonNullable'
import {avatarStackBox, space1Var} from './DocumentPreviewPresence.css'

/** @internal */
export interface DocumentPreviewPresenceProps {
  presence: Omit<DocumentPresence, 'path'>[]
}

const PRESENCE_MENU_POPOVER_PROPS: TooltipProps = {
  portal: true,
}

/** @internal */
export function DocumentPreviewPresence(props: DocumentPreviewPresenceProps) {
  const {presence} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {space} = useThemeV2()

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
        releaseTitle: releaseTitle || t('release-placeholder.title'),
      })
    }

    if (uniquePresence.length > 1) {
      return t('presence.tooltip.other', {count: uniquePresence.length})
    }

    return undefined
  }, [releases, t, uniquePresence])

  return (
    <Tooltip content={tooltipContent} {...PRESENCE_MENU_POPOVER_PROPS}>
      <div
        className={avatarStackBox}
        style={assignInlineVars({
          [space1Var]: `${space[1]}px`,
        })}
      >
        <AvatarStack maxLength={2} aria-label={tooltipContent} size={0}>
          {uniquePresence.map((item) => (
            <UserAvatar key={item.user.id} size={0} user={item.user} />
          ))}
        </AvatarStack>
      </div>
    </Tooltip>
  )
}
