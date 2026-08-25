import {type ReleaseDocument} from '@sanity/client'
import {Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type CSSProperties, useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {useDocumentOperation} from '../../../hooks/useDocumentOperation'
import {useDocumentOperationEvent} from '../../../hooks/useDocumentOperationEvent'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {Preview} from '../../../preview/components/Preview'
import {useValuePreview} from '../../../preview/useValuePreview'
import {getPublishedId, getVersionFromId} from '../../../util/draftUtils'
import {releasesLocaleNamespace} from '../../i18n'
import {useActiveReleases} from '../../store/useActiveReleases'
import {useArchivedReleases} from '../../store/useArchivedReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTone} from '../../util/getReleaseTone'

export function UnpublishVersionDialog(props: {
  onClose: () => void
  documentVersionId: string
  documentType: string
  /**
   * Whether the dialog pushes its own completion toasts. Callers rendered inside the document
   * pane should leave this off: `DocumentOperationResults` already toasts the same operation
   * events there, so the dialog would duplicate them. Defaults to `true` for the release tool,
   * which has no such listener.
   */
  showCompletionToasts?: boolean
}): React.JSX.Element {
  const {onClose, documentVersionId, documentType, showCompletionToasts = true} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: coreT} = useTranslation()

  const schema = useSchema()
  const publishedId = getPublishedId(documentVersionId)
  // The bundle to unpublish is the one encoded in the id, never the selected perspective: the
  // dialog is opened from the release tool's document table and from version chips, where the
  // selected perspective is frequently a different release.
  const scopeId = getVersionFromId(documentVersionId)
  const {unpublish} = useDocumentOperation(publishedId, documentType, scopeId)
  // Without a bundle segment in the id there is no release to unpublish within, and the operation
  // would target the draft/published pair and hard-unpublish the document instead. The version
  // operation this replaced threw in that case.
  const canUnpublish = Boolean(scopeId) && !unpublish.disabled
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  const toast = useToast()
  const {data} = useActiveReleases()
  const {data: archivedReleases} = useArchivedReleases()

  const release = data
    .concat(archivedReleases)
    .find((candidate) => getReleaseIdFromReleaseDocumentId(candidate._id) === scopeId)

  const tone = getReleaseTone(release as ReleaseDocument)
  const schemaType = schema.get(documentType)

  const previewedValue = useMemo(() => ({_id: documentVersionId}), [documentVersionId])
  const preview = useValuePreview({schemaType, value: previewedValue})
  const previewTitle = preview?.value?.title

  const event = useDocumentOperationEvent(publishedId, documentType)
  const prevEvent = useRef(event)
  const awaitingUnpublishRef = useRef(false)

  useEffect(() => {
    if (!event || event === prevEvent.current) return
    prevEvent.current = event

    if (!awaitingUnpublishRef.current) return
    // `operationEvents` is keyed by published id and type only, so an unpublish of another bundle
    // of the same document would otherwise be mistaken for this dialog's own result.
    if (event.op !== 'unpublish' || event.idPair.versionId !== documentVersionId) return

    awaitingUnpublishRef.current = false

    if (showCompletionToasts) {
      toast.push(
        event.type === 'success'
          ? {
              closable: true,
              status: 'success',
              description: (
                <Translate
                  t={coreT}
                  i18nKey={'release.action.unpublish-version.success'}
                  values={{title: previewTitle || documentVersionId}}
                />
              ),
            }
          : {
              closable: true,
              status: 'error',
              title: coreT('release.action.unpublish-version.failure'),
              description: event.error.message,
            },
      )
    }

    onClose()
  }, [coreT, documentVersionId, event, onClose, previewTitle, showCompletionToasts, toast])

  const handleUnpublish = useCallback(() => {
    if (!canUnpublish) return

    setIsUnpublishing(true)
    awaitingUnpublishRef.current = true
    unpublish.execute()
  }, [canUnpublish, unpublish])

  return (
    <Dialog
      header={t('unpublish-dialog.header')}
      id="document-unpublish-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      width={0}
      padding={false}
      footer={{
        cancelButton: {
          text: t('unpublish-dialog.action.cancel'),
          onClick: onClose,
        },
        confirmButton: {
          text: t('unpublish-dialog.action.unpublish'),
          onClick: handleUnpublish,
          tone: 'critical',
          disabled: isUnpublishing || !canUnpublish,
          loading: isUnpublishing,
        },
      }}
    >
      <Stack gap={4} paddingX={4} paddingBottom={4}>
        {schemaType ? (
          <Preview value={{_id: documentVersionId}} schemaType={schemaType} />
        ) : (
          <LoadingBlock />
        )}
        <Text muted size={1}>
          <Translate
            t={t}
            i18nKey="unpublish-dialog.description.to-draft"
            values={{
              title: release?.metadata.title || coreT('release.placeholder-untitled-release'),
            }}
            components={{
              Label: ({children}) => {
                return (
                  <span
                    style={
                      {
                        color: `var(--card-badge-${tone ?? 'default'}-fg-color)`,
                        backgroundColor: `var(--card-badge-${tone ?? 'default'}-bg-color)`,
                        borderRadius: 3,
                        textDecoration: 'none',
                        padding: '0px 2px',
                        fontWeight: 500,
                      } as CSSProperties
                    }
                  >
                    {children}
                  </span>
                )
              },
            }}
          />
        </Text>
        <Text muted size={1}>
          {t('unpublish-dialog.description.lost-changes')}
        </Text>
      </Stack>
    </Dialog>
  )
}
