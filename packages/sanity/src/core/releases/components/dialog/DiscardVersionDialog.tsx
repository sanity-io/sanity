import {getVersionNameFromId, type VersionId} from '@sanity/id-utils'
import {Box, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {LoadingBlock} from '../../../components'
import {useDocumentOperation, useSchema} from '../../../hooks'
import {getPairTarget, useTargetDocumentState} from '../../../hooks/useTargetDocumentState'
import {Translate, useTranslation} from '../../../i18n'
import {type TargetPerspective} from '../../../perspective/types'
import {Preview} from '../../../preview'
import {getPublishedId, isDraftId} from '../../../util/draftUtils'
import {releasesLocaleNamespace} from '../../i18n'

/**
 * @internal
 */
export function DiscardVersionDialog(props: {
  onClose: () => void
  documentId: string
  documentType: string
  fromPerspective: string | TargetPerspective
  isGoingToUnpublish: boolean
}): React.JSX.Element {
  const {onClose, documentId, documentType, fromPerspective, isGoingToUnpublish} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: coreT} = useTranslation()
  const targetDocumentState = useTargetDocumentState(getPublishedId(documentId))
  // The scope of the document targeted by the selected perspective, so that discarding a draft
  // targets the variant-scoped version when a variant is selected (undefined when the target is
  // still resolving or the draft/published pair applies). While resolving, confirming is
  // disabled below instead of silently operating on the base pair.
  const isTargetReady = targetDocumentState.status === 'ready'
  const {discardChanges} = useDocumentOperation(
    getPublishedId(documentId),
    documentType,
    getPairTarget(targetDocumentState),
  )
  const schema = useSchema()
  const [isDiscarding, setIsDiscarding] = useState(false)
  const discardType = isDraftId(documentId) ? 'draft' : 'release'
  const rawReleaseName =
    typeof fromPerspective === 'string' ? fromPerspective : fromPerspective.metadata.title
  const currentRelease = getVersionNameFromId(documentId as VersionId)
  const releaseName = rawReleaseName || coreT('release.placeholder-untitled-release')

  const schemaType = schema.get(documentType)

  const handleDiscardVersion = useCallback(() => {
    if (discardChanges.disabled) {
      return
    }
    setIsDiscarding(true)
    discardChanges.execute()
    setIsDiscarding(false)
    onClose()
  }, [onClose, discardChanges])

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
        },
      }}
    >
      <Stack space={3} paddingX={3} marginBottom={2}>
        {schemaType ? (
          <Preview
            value={{_id: isGoingToUnpublish ? getPublishedId(documentId) : documentId}}
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
