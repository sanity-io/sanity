import {AddIcon, CalendarIcon, CopyIcon, TrashIcon} from '@sanity/icons'
import {Menu, MenuDivider, Spinner, Stack} from '@sanity/ui'
import {memo} from 'react'
import {isPublishedId, type ReleaseDocument, useTranslation} from 'sanity'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'

import {MenuGroup, MenuItem} from '../../../../../../../ui-components'
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
  } = props
  const {t} = useTranslation()
  const isPublished = isPublishedId(documentId) && !isVersion

  const optionsReleaseList = releases.map((release) => ({
    value: release,
  }))
  const releaseId = isVersion ? fromRelease : documentId

  return (
    <>
      <Menu>
        {isVersion && (
          <IntentLink
            intent="release"
            params={{id: releaseId}}
            target="_blank"
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
          disabled={disabled}
        >
          <ReleasesList key={fromRelease} space={1}>
            {optionsReleaseList.map((option) => {
              return (
                <MenuItem
                  as="a"
                  key={option.value._id}
                  onClick={() => onCreateVersion(option.value._id)}
                  text={option.value.metadata?.title}
                  renderMenuItem={() => <VersionContextMenuItem release={option.value} />}
                  disabled={disabled}
                />
              )
            })}
          </ReleasesList>{' '}
          {optionsReleaseList.length > 1 && <MenuDivider />}
          <MenuItem
            onClick={onCreateRelease}
            text={t('release.action.new-release')}
            icon={AddIcon}
          />
        </MenuGroup>
        {!isPublished && (
          <>
            <MenuDivider />
            <MenuItem
              icon={TrashIcon}
              onClick={onDiscard}
              text={t('release.action.discard-version')}
              disabled={disabled}
            />
          </>
        )}
      </Menu>
    </>
  )
})
