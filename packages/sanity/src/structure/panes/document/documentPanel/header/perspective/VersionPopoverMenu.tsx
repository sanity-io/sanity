import {AddIcon, CalendarIcon, CopyIcon, TrashIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Menu, MenuDivider, Spinner, Stack} from '@sanity/ui'
import {memo, useCallback} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  type BundleDocument,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isPublishedId,
  useDocumentOperation,
  useDocumentStore,
  usePerspective,
  useTranslation,
} from 'sanity'
import {IntentLink} from 'sanity/router'

import {AddedVersion} from '../../../../../../core/releases/__telemetry__/releases.telemetry'
import {MenuGroup, MenuItem} from '../../../../../../ui-components'
import {VersionPopoverMenuItem} from './VersionPopoverMenuItem'

export const VersionPopoverMenu = memo(function VersionPopoverMenu(props: {
  documentId: string
  releases: BundleDocument[]
  releasesLoading: boolean
  documentType: string
  fromRelease: string
  isVersion: boolean
  onDiscard: () => void
  onCreateRelease: () => void
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
  } = props
  const {t} = useTranslation()
  const {setPerspective} = usePerspective()
  const isPublished = isPublishedId(documentId) && !isVersion

  const optionsReleaseList = releases.map((release) => ({
    value: release,
  }))

  const publishedId = getPublishedId(documentId)

  const releaseId = isVersion ? getVersionFromId(documentId) : documentId

  const {createVersion} = useDocumentOperation(publishedId, documentType, fromRelease)

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

      createVersion.execute(docId)

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
          >
            {/* eslint-disable-next-line @sanity/i18n/no-attribute-string-literals*/}
            <MenuItem icon={CalendarIcon} text={`View release`} />
          </IntentLink>
        )}
        {releasesLoading && <Spinner />}
        <MenuGroup icon={CopyIcon} popover={{placement: 'right-start'}} text="Copy version to">
          <Stack key={fromRelease} space={1}>
            {optionsReleaseList.map((option) => {
              return (
                <MenuItem
                  as="a"
                  key={option.value._id}
                  onClick={() => handleAddVersion(option.value._id)}
                  text={option.value.title}
                  renderMenuItem={() => <VersionPopoverMenuItem release={option.value} />}
                />
              )
            })}

            {optionsReleaseList.length > 1 && <MenuDivider />}
            {/* eslint-disable-next-line @sanity/i18n/no-attribute-string-literals*/}
            <MenuItem onClick={onCreateRelease} text={'New release'} icon={AddIcon} />
          </Stack>
        </MenuGroup>
        {!isPublished && (
          <>
            <MenuDivider />
            <MenuItem
              icon={TrashIcon}
              onClick={onDiscard}
              text={t('release.action.discard-version')}
            />
          </>
        )}
      </Menu>
    </>
  )
})
