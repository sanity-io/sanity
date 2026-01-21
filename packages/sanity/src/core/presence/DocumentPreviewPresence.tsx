/* eslint-disable camelcase */

import {AvatarStack} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {useMemo} from 'react'
import {css, styled} from 'styled-components'

import {Tooltip, type TooltipProps} from '../../ui-components/tooltip/Tooltip'
import {UserAvatar} from '../components/userAvatar/UserAvatar'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {useActiveReleases} from '../releases/store/useActiveReleases'
import {releasesLocaleNamespace} from '../releases/i18n'
import type {DocumentPresence} from '../store/_legacy/presence/types'
import {getVersionFromId} from '../util/draftUtils'
import {isNonNullable} from '../util/isNonNullable'

/** @internal */
export interface DocumentPreviewPresenceProps {
  presence: Omit<DocumentPresence, 'path'>[]
}

const PRESENCE_MENU_POPOVER_PROPS: TooltipProps = {
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
  const {t} = useTranslation(releasesLocaleNamespace)

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
      const release = documentId
        ? releases.find(
            (r) => getReleaseIdFromReleaseDocumentId(r._id) === getVersionFromId(documentId),
          )
        : undefined
      const releaseTitle = release?.metadata?.title
      return t('presence.tooltip.one', {
        displayName: firstPresence.user.displayName,
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
      <AvatarStackBox>
        <AvatarStack maxLength={2} aria-label={tooltipContent} size={0}>
          {uniquePresence.map((item) => (
            <UserAvatar key={item.user.id} size={0} user={item.user} />
          ))}
        </AvatarStack>
      </AvatarStackBox>
    </Tooltip>
  )
}
