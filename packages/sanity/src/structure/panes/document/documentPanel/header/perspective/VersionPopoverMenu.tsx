import {CalendarIcon, CopyIcon, TrashIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Menu, MenuDivider, Spinner, useToast} from '@sanity/ui'
import {memo, useCallback, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  type BundleDocument,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isPublishedId,
  isVersionId,
  Translate,
  useClient,
  useDocumentOperation,
  useDocumentStore,
  usePerspective,
  useTranslation,
} from 'sanity'
import {IntentLink} from 'sanity/router'

import {AddedVersion} from '../../../../../../core/releases/__telemetry__/releases.telemetry'
import {MenuGroup, MenuItem} from '../../../../../../ui-components'

export const VersionPopoverMenu = memo(function VersionPopoverMenu(props: {
  documentId: string
  releases: BundleDocument[]
  releasesLoading: boolean
  documentType: string
  menuReleaseId: string
  fromRelease: string
}) {
  const {documentId, releases, releasesLoading, documentType, menuReleaseId, fromRelease} = props
  const [isDiscarding, setIsDiscarding] = useState(false)
  const {t} = useTranslation()
  const {setPerspective} = usePerspective()
  const isVersion = isVersionId(documentId)
  const isPublished = isPublishedId(documentId)

  const optionsReleaseList = releases.map((release) => ({
    value: release,
  }))

  const toast = useToast()

  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
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

  const handleDiscardVersion = useCallback(async () => {
    setIsDiscarding(true)
    try {
      // if it's a version it'll always use the versionId based on the menu that it's pressing
      // otherwise it'll use the documentId
      const docId = isVersion ? getVersionId(documentId, menuReleaseId) : documentId

      await client.delete(docId)

      toast.push({
        closable: true,
        status: 'success',
        description: (
          <Translate
            t={t}
            i18nKey={'release.action.discard-version.success'}
            values={{title: document.title as string}}
          />
        ),
      })
    } catch (e) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.action.discard-version.failure'),
      })
    }

    setIsDiscarding(false)
  }, [client, documentId, isVersion, menuReleaseId, t, toast])

  /* @todo update literal */
  return (
    <Menu>
      {isVersion && (
        <MenuItem
          as={IntentLink}
          icon={CalendarIcon}
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
          text={`View release`}
          params={{id: releaseId}}
          intent={'release'}
          target="_blank"
          rel="noopener noreferrer"
        />
      )}
      {releasesLoading && <Spinner />}
      <MenuGroup icon={CopyIcon} popover={{placement: 'right-start'}} text="Copy version to">
        {optionsReleaseList.map((option) => (
          <MenuItem
            key={option.value._id}
            onClick={() => handleAddVersion(option.value._id)}
            text={option.value.title}
          />
        ))}
      </MenuGroup>
      {!isPublished && (
        <>
          <MenuDivider />
          <MenuItem
            icon={TrashIcon}
            onClick={handleDiscardVersion}
            disabled={isDiscarding}
            text={t('release.action.discard-version')}
          />
        </>
      )}
    </Menu>
  )
})
