import {Card, Spinner} from '@sanity/ui'
import {Box, Flex, Text, VStack} from 'ui5'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {useDocumentPreviewValues} from '../../../tasks/hooks/useDocumentPreviewValues'
import {
  type SkippedVariantDocument,
  type VariantDocumentDuplicationPlan,
} from '../../documents/getVariantDocumentDuplicationPlan'
import {variantsLocaleNamespace} from '../../i18n'

/**
 * What the dialog is busy creating: only the definition, or the definition and its documents.
 *
 * @internal
 */
export type DuplicatingState = 'definition' | 'documents' | null

interface DuplicateVariantDocumentsDialogProps {
  duplicating: DuplicatingState
  error: boolean
  loading: boolean
  onClose: () => void
  onConfirm: () => void
  onDefinitionOnly: () => void
  plan: VariantDocumentDuplicationPlan
  /** The original variant: its id resolves the previews, its title is shown in the copy. */
  variantId: string
  variantTitle: string
}

function SkippedDocument({
  skipped,
  variantId,
}: {
  skipped: SkippedVariantDocument
  variantId: string
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const {document, reason, release} = skipped
  const releaseTitle = release?.metadata.title ?? document.version.bundleId ?? ''
  const {isLoading, value} = useDocumentPreviewValues({
    documentId: document.document._id,
    documentType: document.document._type,
    perspectiveStack: [document.version.bundleId ?? 'drafts', 'drafts'],
    variant: variantId,
  })

  const reasonText =
    reason === 'scheduled-release'
      ? t('dialog.duplicate-documents.skipped.scheduled-release', {release: releaseTitle})
      : t('dialog.duplicate-documents.skipped.going-to-unpublish', {release: releaseTitle})

  return (
    <Flex alignItems="center" data-testid="duplicate-variant-skipped-document" gap={2}>
      {release && (
        <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
          <ReleaseAvatarIcon release={release} />
        </Box>
      )}
      <Box flexBasis="0%" flexGrow={1} style={{minWidth: 0}}>
        <SanityDefaultPreview
          {...value}
          isPlaceholder={isLoading}
          layout="default"
          subtitle={reasonText}
        />
      </Box>
    </Flex>
  )
}

/**
 * Asks whether the documents of the variant being duplicated should be copied into the duplicate,
 * listing the document versions that will not be copied and why.
 *
 * The footer's cancel button duplicates only the definition; closing the dialog returns to the form.
 *
 * @internal
 */
export function DuplicateVariantDocumentsDialog({
  duplicating,
  error,
  loading,
  onClose,
  onConfirm,
  onDefinitionOnly,
  plan,
  variantId,
  variantTitle,
}: DuplicateVariantDocumentsDialogProps): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const isDuplicating = duplicating !== null
  const nothingToCopy = plan.toCreate.length === 0

  return (
    <Dialog
      data-testid="duplicate-variant-documents-dialog"
      footer={{
        cancelButton: {
          'data-testid': 'duplicate-variant-definition-only-button',
          'disabled': isDuplicating,
          'loading': duplicating === 'definition',
          'mode': 'ghost',
          'onClick': onDefinitionOnly,
          'text': t('dialog.duplicate-documents.action.definition-only'),
        },
        confirmButton: {
          'data-testid': 'duplicate-variant-documents-button',
          'disabled': isDuplicating || loading || error || nothingToCopy,
          'loading': duplicating === 'documents',
          'onClick': onConfirm,
          'text': t('dialog.duplicate-documents.action.confirm'),
          'tone': 'primary',
        },
      }}
      header={t('dialog.duplicate-documents.title')}
      id="duplicate-variant-documents-dialog"
      onClose={isDuplicating ? undefined : onClose}
      width={1}
    >
      {loading ? (
        <Flex alignItems="center" gap={3} data-testid="duplicate-variant-documents-loading">
          <Spinner muted size={1} />
          <Text muted size={1} as="div" trim={true}>
            {t('dialog.duplicate-documents.loading')}
          </Text>
        </Flex>
      ) : error ? (
        <Text muted size={1} as="div" trim={true}>
          {t('detail.documents.error')}
        </Text>
      ) : (
        <VStack gap={4}>
          <Text
            data-testid="duplicate-variant-documents-description"
            muted
            size={1}
            as="div"
            trim={true}
          >
            {nothingToCopy
              ? t('dialog.duplicate-documents.nothing-to-copy', {title: variantTitle})
              : t('dialog.duplicate-documents.description', {
                  count: plan.toCreate.length,
                  title: variantTitle,
                })}
          </Text>
          {plan.skipped.length > 0 && (
            <Card
              border
              data-testid="duplicate-variant-skipped-documents"
              padding={3}
              radius={2}
              tone="caution"
            >
              <VStack gap={3}>
                <Text size={1} weight="medium" as="div" trim={true}>
                  {t('dialog.duplicate-documents.skipped.title')}
                </Text>
                {plan.skipped.map((skipped) => (
                  <SkippedDocument
                    key={skipped.document.document._id}
                    skipped={skipped}
                    variantId={variantId}
                  />
                ))}
              </VStack>
            </Card>
          )}
        </VStack>
      )}
    </Dialog>
  )
}
