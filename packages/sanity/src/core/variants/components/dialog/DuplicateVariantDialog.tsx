import {useToast} from '@sanity/ui/toast'
import {useCallback, useMemo, useState} from 'react'
import {firstValueFrom, of} from 'rxjs'
import {first, timeout} from 'rxjs/operators'

import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {getVariantDocumentDuplicationPlan} from '../../documents/getVariantDocumentDuplicationPlan'
import {useVariantDocumentOperations} from '../../hooks/useVariantDocumentOperations'
import {useVariantDocuments} from '../../hooks/useVariantDocuments'
import {variantsLocaleNamespace} from '../../i18n'
import {useVariantOperations} from '../../store/useVariantOperations'
import {useVariantsStore} from '../../store/useVariantsStore'
import {getVariantId, getVariantTitle} from '../../tool/util'
import {type EditableSystemVariant, type SystemVariant} from '../../types'
import {getDuplicatedVariant} from '../../util/getDuplicatedVariant'
import {
  DuplicateVariantDocumentsDialog,
  type DuplicatingState,
} from './DuplicateVariantDocumentsDialog'
import {VariantDialog} from './VariantDialog'

/**
 * The variants tool reads definitions from the variants store, which lists a new definition only
 * once the global listener has reported it. Opening the duplicate before then renders the detail
 * page's not-found state, so the dialog waits for the store to list it, for at most this long.
 */
const LISTED_TIMEOUT = 10_000

interface DuplicateVariantDialogProps {
  /**
   * The number of documents in `variant`, when the caller already knows it. Decides whether to ask
   * about copying documents while the documents themselves are still loading.
   */
  documentCount?: number | null
  onCancel: () => void
  /** Called with the new variant definition's document id once it has been created. */
  onDuplicated: (duplicatedVariantId: string) => void
  /** The variant definition being duplicated. */
  variant: SystemVariant
}

/**
 * The create form, prefilled from `variant` with the title "title (duplicated)". When `variant` has
 * documents, submitting asks whether to copy them into the duplicate as well
 * ({@link DuplicateVariantDocumentsDialog}). The definition is created first, then every copied
 * document version in one transaction.
 *
 * @internal
 */
export function DuplicateVariantDialog(props: DuplicateVariantDialogProps): React.JSX.Element {
  const {documentCount, onCancel, onDuplicated, variant} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const toast = useToast()
  const schema = useSchema()
  const {byId: releasesById} = useActiveReleases()
  const {createVariant} = useVariantOperations()
  const {duplicateVariantDocuments} = useVariantDocumentOperations()
  const {state$: variantsState$} = useVariantsStore()
  const {
    loading: documentsLoading,
    results: documents,
    error: documentsError,
  } = useVariantDocuments(variant._id)
  const [pendingVariant, setPendingVariant] = useState<EditableSystemVariant | null>(null)
  const [duplicating, setDuplicating] = useState<DuplicatingState>(null)

  const variantTitle = getVariantTitle(variant)
  const [initialValue] = useState(() =>
    getDuplicatedVariant(variant, t('dialog.duplicate.variant-title', {title: variantTitle})),
  )

  const plan = useMemo(
    () => getVariantDocumentDuplicationPlan({documents, releasesById, schema}),
    [documents, releasesById, schema],
  )

  const mayHaveDocuments =
    documentsLoading || documentsError ? documentCount !== 0 : documents.length > 0

  const waitUntilListed = useCallback(
    (variantId: string) =>
      firstValueFrom(
        variantsState$.pipe(
          first((state) => state.variants.has(variantId)),
          timeout({first: LISTED_TIMEOUT, with: () => of(null)}),
        ),
      ),
    [variantsState$],
  )

  const pushSuccessToast = useCallback(
    (copied?: {copiedCount: number; skippedCount: number}) => {
      const description = copied
        ? [
            t('toast.duplicate.documents-copied', {count: copied.copiedCount}),
            copied.skippedCount > 0
              ? t('toast.duplicate.documents-skipped', {count: copied.skippedCount})
              : null,
          ]
            .filter(Boolean)
            .join(' ')
        : undefined

      toast.push({
        closable: true,
        status: 'success',
        title: t('toast.duplicate.success'),
        description,
      })
    },
    [t, toast],
  )

  const handleSubmit = useCallback(
    async (duplicate: EditableSystemVariant) => {
      if (mayHaveDocuments) {
        setPendingVariant(duplicate)
        return
      }

      // Errors reach `VariantDialog`, which reports them and keeps the form open
      await createVariant(duplicate)
      await waitUntilListed(duplicate._id)
      pushSuccessToast()
      onDuplicated(duplicate._id)
    },
    [createVariant, mayHaveDocuments, onDuplicated, pushSuccessToast, waitUntilListed],
  )

  const handleCreate = useCallback(
    async (copyDocuments: boolean) => {
      if (!pendingVariant) {
        return
      }

      setDuplicating(copyDocuments ? 'documents' : 'definition')

      try {
        await createVariant(pendingVariant)
      } catch (error) {
        console.error(error)
        toast.push({
          closable: true,
          status: 'error',
          title: t('dialog.duplicate.error.title'),
        })
        setDuplicating(null)
        setPendingVariant(null)
        return
      }

      if (!copyDocuments) {
        await waitUntilListed(pendingVariant._id)
        pushSuccessToast()
        onDuplicated(pendingVariant._id)
        return
      }

      try {
        await duplicateVariantDocuments({variant: pendingVariant, documents: plan.toCreate})
      } catch (error) {
        console.error(error)
        toast.push({
          closable: true,
          status: 'error',
          title: t('toast.duplicate.documents-error.title'),
          description: error instanceof Error ? error.message : undefined,
        })
        await waitUntilListed(pendingVariant._id)
        onDuplicated(pendingVariant._id)
        return
      }

      await waitUntilListed(pendingVariant._id)
      pushSuccessToast({copiedCount: plan.toCreate.length, skippedCount: plan.skipped.length})
      onDuplicated(pendingVariant._id)
    },
    [
      createVariant,
      duplicateVariantDocuments,
      onDuplicated,
      pendingVariant,
      plan,
      pushSuccessToast,
      t,
      toast,
      waitUntilListed,
    ],
  )

  const handleCloseDocumentsDialog = useCallback(() => setPendingVariant(null), [])
  const handleDefinitionOnly = useCallback(() => void handleCreate(false), [handleCreate])
  const handleCopyDocuments = useCallback(() => void handleCreate(true), [handleCreate])

  return (
    <VariantDialog
      confirmDataTestId="duplicate-variant-button"
      confirmText={t('dialog.duplicate.action.confirm')}
      errorTitle={t('dialog.duplicate.error.title')}
      header={t('dialog.duplicate.title')}
      id="duplicate-variant-dialog"
      initialValue={initialValue}
      onCancel={onCancel}
      onSubmit={handleSubmit}
    >
      {pendingVariant && (
        <DuplicateVariantDocumentsDialog
          duplicating={duplicating}
          error={Boolean(documentsError)}
          loading={documentsLoading}
          onClose={handleCloseDocumentsDialog}
          onConfirm={handleCopyDocuments}
          onDefinitionOnly={handleDefinitionOnly}
          plan={plan}
          variantId={getVariantId(variant._id)}
          variantTitle={variantTitle}
        />
      )}
    </VariantDialog>
  )
}
