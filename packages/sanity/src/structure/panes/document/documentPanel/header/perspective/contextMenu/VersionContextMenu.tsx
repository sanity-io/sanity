import {AddIcon, CalendarIcon, CopyIcon, TrashIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Menu, MenuDivider, Spinner, Stack} from '@sanity/ui'
import {memo, useCallback} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  type BundleDocument,
  getCreateVersionOrigin,
  getPublishedId,
  getVersionId,
  isPublishedId,
  useDocumentOperation,
  useDocumentStore,
  usePerspective,
  useTranslation,
} from 'sanity'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'

import {AddedVersion} from '../../../../../../../core/releases/__telemetry__/releases.telemetry'
import {MenuGroup, MenuItem} from '../../../../../../../ui-components'
import {VersionContextMenuItem} from './VersionContextMenuItem'

const ReleasesList = styled(Stack)`
  max-width: 300px;
  max-height: 200px;
  overflow-y: auto;
`

export const VersionContextMenu = memo(function VersionContextMenu(props: {
  documentId: string
  releases: BundleDocument[]
  releasesLoading: boolean
  documentType: string
  fromRelease: string
  isVersion: boolean
  onDiscard: () => void
  onCreateRelease: () => void
  disabled?: boolean
}) {
  const {
    documentId,
    releases,
    releasesLoading,
    documentType,
    fromRelease,
    isVersion,
    onDiscard,
    onCreateRelease,
    disabled,
  } = props
  const {t} = useTranslation()
  const {setPerspective} = usePerspective()
  const isPublished = isPublishedId(documentId) && !isVersion

  const optionsReleaseList = releases.map((release) => ({
    value: release,
  }))

  const publishedId = getPublishedId(documentId)

  const releaseId = isVersion ? fromRelease : documentId
  const operationVersion = isVersion ? fromRelease : '' // operations recognises publish and draft as empty

  const {createVersion} = useDocumentOperation(publishedId, documentType, operationVersion)

  const telemetry = useTelemetry()
  const documentStore = useDocumentStore()

  const handleAddVersion = useCallback(
    async (targetRelease: string) => {
      // set up the listener before executing
      const createVersionSuccess = firstValueFrom(
        documentStore.pair
          .operationEvents(getPublishedId(documentId), documentType)
          .pipe(filter((e) => e.op === 'createVersion' && e.type === 'success')),
      )

      const docId = getVersionId(publishedId, targetRelease)
      const origin = isVersion ? 'version' : getCreateVersionOrigin(fromRelease)

      createVersion.execute(docId, origin)

      // only change if the version was created successfully
      await createVersionSuccess
      setPerspective(targetRelease)

      telemetry.log(AddedVersion, {
        schemaType: documentType,
        documentOrigin: isVersion ? 'version' : 'draft',
      })
    },
    [
      createVersion,
      documentId,
      documentStore.pair,
      documentType,
      fromRelease,
      isVersion,
      publishedId,
      setPerspective,
      telemetry,
    ],
  )

  /** @todo update literal */
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
            {/* eslint-disable-next-line @sanity/i18n/no-attribute-string-literals*/}
            <MenuItem icon={CalendarIcon} text={`View release`} />
          </IntentLink>
        )}
        {releasesLoading && <Spinner />}
        <MenuGroup
          icon={CopyIcon}
          popover={{placement: 'right-start'}}
          text="Copy version to"
          disabled={disabled}
        >
          <ReleasesList key={fromRelease} space={1}>
            {optionsReleaseList.map((option) => {
              return (
                <MenuItem
                  as="a"
                  key={option.value._id}
                  onClick={() => handleAddVersion(option.value._id)}
                  text={option.value.title}
                  renderMenuItem={() => <VersionContextMenuItem release={option.value} />}
                  disabled={disabled}
                />
              )
            })}
          </ReleasesList>{' '}
          {optionsReleaseList.length > 1 && <MenuDivider />}
          {/* eslint-disable-next-line @sanity/i18n/no-attribute-string-literals*/}
          <MenuItem onClick={onCreateRelease} text={'New release'} icon={AddIcon} />
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
