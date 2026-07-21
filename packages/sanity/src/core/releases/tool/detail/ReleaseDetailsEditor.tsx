import {type ReleaseDocument} from '@sanity/client'
import {EditIcon} from '@sanity/icons/Edit'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {type CSSProperties, useEffect, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../../ui-components/button/Button'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n'
import {EditReleaseDialog} from '../../components/dialog/EditReleaseDialog'
import {getIsReleaseOpen} from '../../components/dialog/TitleDescriptionForm'
import {useReleaseOperations} from '../../index'
import {useReleasePermissions} from '../../store/useReleasePermissions'

const DESCRIPTION_TOOLTIP_MAX_WIDTH = 360

// Bounded, two-line description: the left identity block (title + 2 lines) balances the 3-row
// metadata block on the right, so the top band is one even zone. Full text lives in the hover
// tooltip. maxWidth keeps the line length fixed rather than stretching across the whole pane.
const CLAMP_TWO_LINES: CSSProperties = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
  maxWidth: 560,
}

// The edit affordance is a display surface first: the pencil only appears on hover (or keyboard
// focus, for a11y), so at rest the pane reads as plain content — editing is a deliberate act.
const Identity = styled(Stack)`
  [data-ui='release-edit-trigger'] {
    opacity: 0;
    transition: opacity 150ms;
  }

  &:hover [data-ui='release-edit-trigger'],
  &:focus-within [data-ui='release-edit-trigger'] {
    opacity: 1;
  }
`

/**
 * The release identity (title + description) as a read-only display surface. Editing is an explicit
 * action — a hover-revealed pencil opens the edit dialog — rather than an always-live inline form,
 * keeping the interaction consistent with how documents are edited elsewhere in Studio.
 */
export function ReleaseDetailsEditor({release}: {release: ReleaseDocument}): React.JSX.Element {
  const {t} = useTranslation()
  const {updateRelease} = useReleaseOperations()
  const {checkWithPermissionGuard} = useReleasePermissions()
  const [hasUpdatePermission, setHasUpdatePermission] = useState<boolean | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const isReleaseOpen = getIsReleaseOpen(release)
  const isMounted = useRef(false)

  useEffect(() => {
    isMounted.current = true

    if (isReleaseOpen) {
      // Editing is only possible on an open release, so only check permission when it's open.
      void checkWithPermissionGuard(updateRelease, release).then((hasPermission) => {
        if (isMounted.current) setHasUpdatePermission(hasPermission)
      })
    }

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, isReleaseOpen, release, updateRelease])

  const canEdit = isReleaseOpen && Boolean(hasUpdatePermission)
  const title = release.metadata.title
  const description = release.metadata.description

  return (
    <Identity space={3}>
      <Flex align="center" gap={2}>
        <Text
          size={4}
          weight="bold"
          style={title ? undefined : {opacity: 0.5}}
          data-testid="release-title-display"
        >
          {title || t('release.placeholder-untitled-release')}
        </Text>
        {canEdit && (
          <Box flex="none" data-ui="release-edit-trigger">
            <Button
              data-testid="edit-release-details-button"
              icon={EditIcon}
              mode="bleed"
              onClick={() => setEditOpen(true)}
              tooltipProps={{content: t('release.action.edit-details')}}
            />
          </Box>
        )}
      </Flex>

      {description && (
        <Tooltip
          placement="bottom-start"
          content={
            <Box padding={2} style={{maxWidth: DESCRIPTION_TOOLTIP_MAX_WIDTH}}>
              <Text muted size={1} style={{whiteSpace: 'pre-wrap'}}>
                {description}
              </Text>
            </Box>
          }
        >
          <Text muted size={2} data-testid="release-description-display" style={CLAMP_TWO_LINES}>
            {description}
          </Text>
        </Tooltip>
      )}

      {editOpen && <EditReleaseDialog release={release} onClose={() => setEditOpen(false)} />}
    </Identity>
  )
}
