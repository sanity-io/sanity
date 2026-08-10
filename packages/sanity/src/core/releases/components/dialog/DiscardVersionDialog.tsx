import {getVersionNameFromId, type VersionId} from '@sanity/id-utils'
import {Box, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useRef, useState} from 'react'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {useDocumentOperation} from '../../../hooks/useDocumentOperation'
import {useDocumentOperationEvent} from '../../../hooks/useDocumentOperationEvent'
import {useSchema} from '../../../hooks/useSchema'
import {
  getPairTarget,
  getTargetScopeId,
  useTargetDocumentState,
} from '../../../hooks/useTargetDocumentState'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {type TargetPerspective} from '../../../perspective/types'
import {Preview} from '../../../preview/components/Preview'
import {
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isDraftId,
  isVersionId,
} from '../../../util/draftUtils'
import {releasesLocaleNamespace} from '../../i18n'

/**
 * @internal
 */
export function DiscardVersionDialog(props: {
  onClose: () => void
  versionId: string
  documentType: string
  fromPerspective: string | TargetPerspective
  isGoingToUnpublish: boolean
}): React.JSX.Element {
  const {onClose, versionId, documentType, fromPerspective, isGoingToUnpublish} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: coreT} = useTranslation()
  const publishedId = getPublishedId(versionId)
  const targetDocumentState = useTargetDocumentState(publishedId)
  // Discarding a version must target the bundle encoded in `versionId`, not the globally selected
  // perspective: the dialog is opened from version chips and the release tool's document table,
  // where the selected perspective can be a different release (or the drafts pair) and would
  // discard the wrong document.
  const discardScopeId = isVersionId(versionId) ? getVersionFromId(versionId) : undefined
  // Only the draft case follows the selected perspective, so that discarding a draft targets the
  // variant-scoped version when a variant is selected. While that lookup resolves, confirming is
  // disabled below instead of silently operating on the base pair.
  const isTargetReady = Boolean(discardScopeId) || targetDocumentState.status === 'ready'
  const {discardChanges} = useDocumentOperation(
    publishedId,
    documentType,
    discardScopeId ?? getPairTarget(targetDocumentState),
  )
  const schema = useSchema()
  const toast = useToast()
  const [isDiscarding, setIsDiscarding] = useState(false)
  const discardType = isDraftId(versionId) ? 'draft' : 'release'
  const rawReleaseName =
    typeof fromPerspective === 'string' ? fromPerspective : fromPerspective.metadata.title
  const currentRelease = getVersionNameFromId(versionId as VersionId)
  const releaseName = rawReleaseName || coreT('release.placeholder-untitled-release')

  const schemaType = schema.get(documentType)

  // The pair the operation runs against, used to recognise this dialog's own completion event:
  // `operationEvents` is keyed by published id and type only, so a discard of another bundle of
  // the same document would otherwise be mistaken for this one.
  const targetScopeId = discardScopeId ?? getTargetScopeId(targetDocumentState)
  const targetVersionId = targetScopeId ? getVersionId(publishedId, targetScopeId) : undefined

  const event = useDocumentOperationEvent(publishedId, documentType)
  const prevEvent = useRef(event)
  const awaitingDiscardRef = useRef(false)

  useEffect(() => {
    if (!event || event === prevEvent.current) return
    prevEvent.current = event

    if (!awaitingDiscardRef.current) return
    if (event.op !== 'discardChanges' || event.idPair.versionId !== targetVersionId) return

    awaitingDiscardRef.current = false

    if (event.type === 'error') {
      toast.push({
        closable: true,
        status: 'error',
        title: coreT('release.action.discard-version.failure'),
        description: event.error.message,
      })
    }

    onClose()
  }, [coreT, event, onClose, targetVersionId, toast])

  const handleDiscardVersion = useCallback(() => {
    if (discardChanges.disabled) return

    setIsDiscarding(true)
    awaitingDiscardRef.current = true
    discardChanges.execute()
  }, [discardChanges])

  return (
    <Dialog
      id={'discard-version-dialog'}
      header={
        <Translate
          t={t}
          i18nKey={`discard-version-dialog.header-${discardType}`}
          values={{releaseTitle: releaseName}}
        />
      }
      onClose={onClose}
      width={0}
      padding={false}
      footer={{
        cancelButton: {
          disabled: isDiscarding,
          onClick: onClose,
        },
        confirmButton: {
          text: t(`discard-version-dialog.title-${discardType}`),
          onClick: handleDiscardVersion,
          disabled: isDiscarding || !isTargetReady || Boolean(discardChanges.disabled),
          loading: isDiscarding,
        },
      }}
    >
      <Stack gap={3} paddingX={3} marginBottom={2}>
        {schemaType ? (
          <Preview
            value={{_id: isGoingToUnpublish ? getPublishedId(versionId) : versionId}}
            schemaType={schemaType}
            // Resolve the preview under the perspective of what's being discarded:
            // the published doc when unpublishing, the drafts perspective when
            // discarding a draft, otherwise the release version. Without the
            // explicit 'drafts' stack a draft falls back to its published value
            // (or "Untitled" when none exists), so it wouldn't show the draft
            // being discarded.
            perspectiveStack={
              isGoingToUnpublish ? [] : discardType === 'draft' ? ['drafts'] : [currentRelease]
            }
          />
        ) : (
          <LoadingBlock />
        )}
        <Box paddingX={2} style={{maxWidth: '400px'}}>
          <Text size={1} muted>
            <Translate
              t={t}
              i18nKey={`discard-version-dialog.description-${discardType}`}
              values={{releaseTitle: releaseName}}
            />
          </Text>
        </Box>
      </Stack>
    </Dialog>
  )
}
