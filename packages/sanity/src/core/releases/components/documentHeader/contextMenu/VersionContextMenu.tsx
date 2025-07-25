import {type ReleaseDocument} from '@sanity/client'
import {CalendarIcon, CopyIcon, TrashIcon} from '@sanity/icons'
import {Menu, MenuDivider, Spinner, Stack} from '@sanity/ui'
import {memo, useEffect, useRef, useState} from 'react'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'

import {MenuGroup} from '../../../../../ui-components/menuGroup/MenuGroup'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useDocumentPairPermissions} from '../../../../store/_legacy/grants/documentPairPermissions'
import {getPublishedId, isPublishedId} from '../../../../util/draftUtils'
import {useReleaseOperations} from '../../../store/useReleaseOperations'
import {useReleasePermissions} from '../../../store/useReleasePermissions'
import {getReleaseDefaults, isReleaseScheduledOrScheduling} from '../../../util/util'
import {CreateReleaseMenuItem} from '../../CreateReleaseMenuItem'
import {VersionContextMenuItem} from './VersionContextMenuItem'

const ReleasesList = styled(Stack)`
  max-width: 300px;
  max-height: 200px;
  overflow-y: auto;
`

export const VersionContextMenu = memo(function VersionContextMenu(props: {
  documentId: string
  releases: ReleaseDocument[]
  releasesLoading: boolean
  fromRelease: string
  isVersion: boolean
  onDiscard: () => void
  onCreateRelease: () => void
  onCreateVersion: (targetId: string) => void
  disabled?: boolean
  locked?: boolean
  type: string
  isGoingToUnpublish?: boolean
}) {
  const {
    documentId,
    releases,
    releasesLoading,
    fromRelease,
    isVersion,
    onDiscard,
    onCreateRelease,
    onCreateVersion,
    disabled,
    locked,
    type,
    isGoingToUnpublish = false,
  } = props
  const {t} = useTranslation()
  const isPublished = isPublishedId(documentId) && !isVersion
  const optionsReleaseList = releases.filter((release) => !isReleaseScheduledOrScheduling(release))

  const {checkWithPermissionGuard} = useReleasePermissions()
  const {createRelease} = useReleaseOperations()
  const [hasCreatePermission, setHasCreatePermission] = useState<boolean | null>(null)

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id: getPublishedId(documentId),
    type,
    version: isVersion ? fromRelease : undefined,
    // Note: the result of this discard permission check is disregarded for the published document
    // version. Discarding is never available for the published document version. Therefore, the
    // parameters provided here are not configured to handle published document versions.
    permission: fromRelease === 'draft' ? 'discardDraft' : 'discardVersion',
  })
  const hasDiscardPermission = !isPermissionsLoading && permissions?.granted

  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true

    checkWithPermissionGuard(createRelease, getReleaseDefaults()).then((hasPermission) => {
      if (isMounted.current) setHasCreatePermission(hasPermission)
    })

    return () => {
      isMounted.current = false
    }
  }, [checkWithPermissionGuard, createRelease])

  return (
    <>
      <Menu>
        {isVersion && (
          <IntentLink
            intent="release"
            params={{id: fromRelease}}
            rel="noopener noreferrer"
            style={{textDecoration: 'none'}}
            disabled={disabled}
          >
            <MenuItem icon={CalendarIcon} text={t('release.action.view-release')} />
          </IntentLink>
        )}
        {releasesLoading && <Spinner />}
        <MenuGroup
          icon={CopyIcon}
          popover={{placement: 'right-start'}}
          text={t('release.action.copy-to')}
          disabled={disabled || !hasCreatePermission || isGoingToUnpublish}
          tooltipProps={{
            disabled: hasCreatePermission === true,
            content: t('release.action.permission.error'),
          }}
          data-testid="copy-version-to-release-button-group"
        >
          <ReleasesList key={fromRelease} space={1}>
            {optionsReleaseList.map((release) => {
              return (
                <MenuItem
                  key={release._id}
                  as="a"
                  onClick={() => onCreateVersion(release._id)}
                  renderMenuItem={() => <VersionContextMenuItem release={release} />}
                  disabled={disabled}
                  tooltipProps={{
                    content: t('release.tooltip.locked'),
                  }}
                />
              )
            })}
          </ReleasesList>{' '}
          {optionsReleaseList.length > 1 && <MenuDivider />}
          <CreateReleaseMenuItem onCreateRelease={onCreateRelease} />
        </MenuGroup>
        {!isPublished && (
          <>
            <MenuDivider />
            <MenuItem
              icon={TrashIcon}
              onClick={onDiscard}
              text={t('release.action.discard-version')}
              disabled={disabled || locked || !hasDiscardPermission}
              tooltipProps={{
                disabled: hasDiscardPermission === true,
                content: t('release.action.permission.error'),
              }}
            />
          </>
        )}
      </Menu>
    </>
  )
})
