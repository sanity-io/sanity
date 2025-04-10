/* eslint-disable camelcase */

import {AvatarStack} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {useMemo} from 'react'
import {css, styled} from 'styled-components'

import {Tooltip, type TooltipProps} from '../../ui-components'
import {UserAvatar} from '../components'
import {getReleaseIdFromReleaseDocumentId, useActiveReleases} from '../releases'
import {type DocumentPresence} from '../store'
import {getVersionFromId, isNonNullable} from '../util'

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
      return `${firstPresence.user.displayName} is editing this document${releaseTitle ? ` in the release "${releaseTitle}" right now` : 'in an untitled release right now'}`
    }

    if (uniquePresence.length > 1) {
      return `${uniquePresence.length} people are editing this document right now`
    }

    return undefined
  }, [uniquePresence, releases])

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
