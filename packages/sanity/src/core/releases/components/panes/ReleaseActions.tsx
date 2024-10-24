import {AddIcon, TrashIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui'
import {type ReactNode, useCallback, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'

import {Button} from '../../../../ui-components'
import {useClient, useDocumentOperation} from '../../../hooks'
import {Translate, useTranslation} from '../../../i18n'
import {useDocumentStore} from '../../../store'
import {type ReleaseDocument} from '../../../store/release/types'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {getPublishedId, getVersionFromId, getVersionId} from '../../../util'
import {AddedVersion} from '../../__telemetry__/releases.telemetry'
import {getCreateVersionOrigin} from '../../util/util'

interface ReleaseActionsProps {
  currentGlobalBundle: ReleaseDocument
  /**
   * The id of the document that is displayed in the form, might be a draft, a version, or the published one.
   * e.g: foo, drafts.foo, version.summer.foo
   */
  documentId: string
  documentType: string
  releaseId?: string
}

/**
 * @internal
 */
export function ReleaseActions(props: ReleaseActionsProps): ReactNode {
  const {currentGlobalBundle, documentType, documentId, releaseId} = props
  const publishedId = getPublishedId(documentId)
  const {
    _id: releaseDocumentId,
    metadata: {title, archivedAt},
  } = currentGlobalBundle
  const documentStore = useDocumentStore()
  const [creatingVersion, setCreatingVersion] = useState<boolean>(false)
  const [isInVersion, setIsInVersion] = useState<boolean>(
    () => getVersionFromId(documentId) === releaseDocumentId,
  )
  const [isDiscarding, setIsDiscarding] = useState<boolean>(false)
  const toast = useToast()
  const {createVersion} = useDocumentOperation(publishedId, documentType, releaseId)
  const {t} = useTranslation()
  const telemetry = useTelemetry()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  /** @todo remove this when task to tackle footer actions */
  const handleAddVersion = useCallback(async () => {
    if (!documentId) {
      toast.push({
        status: 'error',
        title: "Can't add version without a base document",
      })
      return
    }
    // only add to version if there isn't already a version in that release of this doc
    if (getVersionFromId(documentId) === releaseDocumentId) {
      toast.push({
        status: 'error',
        title: `There's already a version of this document in the release ${title}`,
      })
      return
    }

    const versionId = getVersionId(documentId, releaseDocumentId)

    setCreatingVersion(true)

    // set up the listener before executing
    const createVersionSuccess = firstValueFrom(
      documentStore.pair
        .operationEvents(getPublishedId(documentId), documentType)
        .pipe(filter((e) => e.op === 'createVersion' && e.type === 'success')),
    )

    const origin = getCreateVersionOrigin(documentId)

    createVersion.execute(versionId, origin)

    // only change if the version was created successfully
    await createVersionSuccess
    setIsInVersion(true)

    telemetry.log(AddedVersion, {
      schemaType: documentType,
      documentOrigin: origin,
    })
  }, [
    documentId,
    releaseDocumentId,
    documentStore.pair,
    documentType,
    createVersion,
    telemetry,
    toast,
    title,
  ])

  const handleDiscardVersion = useCallback(async () => {
    setIsDiscarding(true)
    try {
      // TODO: should we use the document operations for this?
      await client.delete(documentId)

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

      setIsInVersion(false)
    } catch (e) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.action.discard-version.failure'),
      })
    }

    setIsDiscarding(false)
  }, [client, documentId, t, toast])

  if (archivedAt) return null

  const releaseActionButtonProps = isInVersion
    ? {
        text: t('release.action.discard-version', {title}),
        icon: TrashIcon,
        tone: 'caution' as const,
        onClick: handleDiscardVersion,
      }
    : {
        text: t('release.action.add-to-release', {title}),
        icon: AddIcon,
        tone: 'primary' as const,
        onClick: handleAddVersion,
      }

  return (
    <Button
      {...releaseActionButtonProps}
      data-testid={`action-add-to-${releaseDocumentId}`}
      loading={creatingVersion || isDiscarding}
    />
  )
}
