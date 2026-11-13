import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useState} from 'react'
import {
  getDefaultVariant,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVariantTitle,
  isDraftPerspective,
  isReleaseDocument,
  RELEASES_INTENT,
  type TargetPerspective,
  Translate,
  useConditionalToast,
  useDocumentVersions,
  usePerspective,
  useSetPerspective,
  useTranslation,
  useVariantDocumentOperations,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {Text} from 'ui5'

import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {structureLocaleNamespace} from '../../../../i18n'
import {CREATE_VARIANT_PARAM, DOCUMENT_GROUP_INSPECTOR_NAME} from '../../constants'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'
import {
  hiddenSentence,
  inlineAction,
  sentence,
  sentenceStack,
} from './DocumentNotInVariantBanner.css'
import {findVariantCreateBaseDocument} from './findVariantCreateBaseDocument'
import {type VariantBannerCase} from './getVariantBannerCase'
import {
  DraftsBadge,
  ReleaseBadge,
  VariantBadge,
  type VariantBannerChipProps,
} from './VariantBannerChips'

// Once the create action resolves, there's a short delay before the new variant-scoped version
// propagates and this banner unmounts. Surface a toast if that window exceeds this threshold.
const TOAST_DELAY = 1000

type VariantDocumentCreateStatus = 'idle' | 'in-progress' | 'success' | 'failed'

/** The cases this banner draws: the selected variant exists but has no version in the perspective in view. */
export type NotInVariantBannerCase = Extract<
  VariantBannerCase,
  {kind: 'create' | 'create-in-drafts' | 'switch-to-drafts' | 'locked-release'}
>

const chips = {VariantBadge, ReleaseBadge, DraftsBadge}

/** The sentence of each create case without its instruction, for the link into the document inventory. */
const STATEMENT_KEYS: Record<string, string> = {
  'banners.variant.not-in-variant': 'banners.variant.statement.no-draft',
  'banners.variant.not-in-variant-published': 'banners.variant.statement.no-published-version',
  'banners.variant.not-in-variant-published-create-in-drafts':
    'banners.variant.statement.no-published-version',
  'banners.variant.not-in-variant-release': 'banners.variant.statement.no-release-version',
  'banners.variant.not-in-variant-release-asap':
    'banners.variant.statement.no-release-version-asap',
  'banners.variant.not-in-variant-release-undecided':
    'banners.variant.statement.no-release-version-undecided',
}

/**
 * The selected variant has no version in the perspective in view (see `getVariantBannerCase`).
 * Neutral with the info icon, as the release banners; the variant chip carries the purple.
 */
export function DocumentNotInVariantBanner({bannerCase}: {bannerCase: NotInVariantBannerCase}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()
  const {value, documentId, schemaType} = useDocumentPane()
  const {params, setParams} = usePaneRouter()
  // While the document inventory is open, its own Create variant button is the view's one filled
  // button, so the banner yields its create action to it. With the inventory's Create variant form
  // open (see CREATE_VARIANT_PARAM), the banner only points to the form; otherwise its sentence ends
  // with a link that opens the form for this variant.
  // Both read from the pane's router params on every render, never copied into local state, so
  // the banner follows the inventory and its form opening and closing while it is on screen.
  const inventoryOpen = params?.inspect === DOCUMENT_GROUP_INSPECTOR_NAME
  const formOpen = inventoryOpen && Boolean(params?.[CREATE_VARIANT_PARAM])
  const {selectedPerspective, selectedVariants} = usePerspective()
  const selectedVariant = getDefaultVariant(selectedVariants)
  const {versions} = useDocumentVersions({documentId})
  const setPerspective = useSetPerspective()
  const {navigateIntent} = useRouter()

  const {createVariantDocument} = useVariantDocumentOperations()
  const [status, setStatus] = useState<VariantDocumentCreateStatus>('idle')
  const toast = useToast()

  const variantTitle = selectedVariant ? getVariantTitle(selectedVariant) : ''
  const release = isReleaseDocument(selectedPerspective) ? selectedPerspective : undefined
  const releaseTitle = release
    ? release.metadata?.title || tCore('release.placeholder-untitled-release')
    : typeof selectedPerspective === 'string'
      ? selectedPerspective
      : ''

  const createVariant = useCallback(
    async (createPerspective: TargetPerspective) => {
      if (!selectedVariant) {
        return false
      }

      setStatus('in-progress')
      try {
        if (!value._createdAt) {
          const {_id, _rev, _createdAt, _updatedAt, _system, ...document} = value
          // The document doesn't exists yet, so we can't use it's id as a base.
          // Instead, let's pass it as the initial value for the new document.
          await createVariantDocument({
            document: document,
            documentGroupId: documentId,
            variant: selectedVariant,
            selectedPerspective: createPerspective,
          })
        } else {
          const baseDocument = findVariantCreateBaseDocument({
            variant: selectedVariant,
            documentVersions: versions,
            fallback: {_id: value._id, _rev: value._rev},
          })

          await createVariantDocument({
            baseId: baseDocument._id,
            ifBaseRevisionId: baseDocument._rev,
            documentGroupId: documentId,
            variant: selectedVariant,
            selectedPerspective: createPerspective,
          })
        }
        setStatus('success')
        return true
      } catch (err) {
        toast.push({
          status: 'error',
          closable: true,
          title: t('banners.variant.error.title'),
          description: t('banners.variant.error.description', {
            message: err instanceof Error ? err.message : String(err),
          }),
        })
        setStatus('failed')
        return false
      }
    },
    [createVariantDocument, documentId, value, selectedVariant, setStatus, t, toast, versions],
  )

  useConditionalToast({
    status: 'info',
    id: 'add-document-to-variant',
    // The create-in-drafts case navigates away, so it never waits here.
    enabled: status === 'success' && bannerCase.kind === 'create',
    delay: TOAST_DELAY,
    closable: true,
    title: t('banners.variant.waiting.title'),
    description: t('banners.variant.waiting.description'),
  })

  const handleCreate = useCallback(() => {
    if (bannerCase.kind === 'create-in-drafts') {
      // Published, with no draft of the variant: create the draft, then show it in Drafts. The
      // variant is a separate sticky param, so it stays selected.
      void createVariant('drafts').then((created) => {
        if (created) setPerspective('drafts')
      })
      return
    }
    if (bannerCase.kind !== 'create') return
    // Live-edit documents have no drafts sibling: create the variant-of-published even when the
    // studio is pinned to drafts. Release perspectives still target the release.
    const createPerspective =
      bannerCase.perspective === 'published' ||
      (schemaType?.liveEdit && isDraftPerspective(selectedPerspective))
        ? 'published'
        : selectedPerspective
    void createVariant(createPerspective)
  }, [bannerCase, createVariant, schemaType?.liveEdit, selectedPerspective, setPerspective])

  const handleOpenRelease = useCallback(() => {
    if (release) {
      navigateIntent(RELEASES_INTENT, {id: getReleaseIdFromReleaseDocumentId(release._id)})
    }
  }, [navigateIntent, release])

  const busy = status === 'in-progress' || status === 'success'
  const createAction = {
    text: t('banners.variant.action.add-to-variant'),
    // A filled action: Banner draws it as the default primary; the variant chip carries the purple.
    mode: 'default' as const,
    disabled: busy,
    onClick: handleCreate,
  }

  let i18nKey: string
  let action: Parameters<typeof Banner>[0]['action']
  switch (bannerCase.kind) {
    case 'create':
      i18nKey =
        bannerCase.perspective === 'drafts'
          ? 'banners.variant.not-in-variant'
          : bannerCase.perspective === 'published'
            ? 'banners.variant.not-in-variant-published'
            : release?.metadata?.releaseType === 'asap'
              ? 'banners.variant.not-in-variant-release-asap'
              : release?.metadata?.releaseType === 'undecided'
                ? 'banners.variant.not-in-variant-release-undecided'
                : 'banners.variant.not-in-variant-release'
      action = createAction
      break
    case 'create-in-drafts':
      i18nKey = 'banners.variant.not-in-variant-published-create-in-drafts'
      action = createAction
      break
    case 'switch-to-drafts':
      i18nKey = 'banners.variant.not-in-variant-published-switch-to-drafts'
      action = {
        text: t('banners.variant.action.switch-to-drafts'),
        onClick: () => setPerspective('drafts'),
      }
      break
    case 'locked-release':
    default:
      i18nKey = 'banners.variant.not-in-variant-locked-release'
      // Nothing can be added to a scheduled release: the way to add a version is to unschedule it, in the Releases tool.
      action = release
        ? {text: t('banners.variant.action.open-release'), onClick: handleOpenRelease}
        : undefined
      break
  }

  const yields = inventoryOpen && action === createAction
  const handleCreateInInventory = () => {
    if (!selectedVariant) return
    setParams({...params, [CREATE_VARIANT_PARAM]: selectedVariant._id})
  }
  // While it yields, the sentence stops before its own instruction ("Create one to start editing"),
  // and the link or the pointer says where to do it instead.
  // The three states of the create action: the filled button, the link into the open inventory,
  // and the pointer to its open form.
  const hasCreateAction = action === createAction
  let sentenceState: SentenceState = 'button'
  if (yields) sentenceState = formOpen ? 'pointer' : 'link'
  const sentenceProps = {
    bannerCase: bannerCase.kind,
    i18nKey,
    statementKey: STATEMENT_KEYS[i18nKey] ?? i18nKey,
    values: {variantTitle, releaseTitle, draftsTitle: tCore('release.chip.global.drafts')},
    componentProps: {
      variantLead: t('banners.variant.lead.variant'),
      releaseLead: t('banners.release.lead.release'),
      releaseTone: getReleaseTone(selectedPerspective),
      // The Draft pill's orange, not core's grey drafts tone
      draftsTone: 'caution' as const,
    },
    busy,
    onCreateInInventory: handleCreateInInventory,
  }

  return (
    <Banner
      tone="neutral"
      icon={InfoOutlineIcon}
      content={
        hasCreateAction ? (
          // Every state's sentence keeps its space, so the banner's height does not change as
          // the inventory and its form open and close
          <div className={sentenceStack}>
            {SENTENCE_STATES.map((state) => (
              <BannerSentence
                key={state}
                {...sentenceProps}
                state={state}
                current={sentenceState}
                stacked
              />
            ))}
          </div>
        ) : (
          <BannerSentence {...sentenceProps} state="button" current="button" />
        )
      }
      // While it yields, the action keeps its space (hidden), so the banner keeps its height at
      // every width and the form below does not move
      action={action}
      reserveAction={yields}
    />
  )
}

const SENTENCE_STATES = ['button', 'link', 'pointer'] as const
type SentenceState = (typeof SENTENCE_STATES)[number]

/**
 * The banner's sentence in one state of its create action. Stacked, every state is rendered in the
 * same grid cell and only the current one is visible; the others keep their space but are hidden
 * from sight, focus and assistive technology.
 */
function BannerSentence(props: {
  state: SentenceState
  current: SentenceState
  stacked?: boolean
  bannerCase: string
  i18nKey: string
  statementKey: string
  values: Record<string, string>
  componentProps: VariantBannerChipProps
  busy: boolean
  onCreateInInventory: () => void
}) {
  const {state, current, stacked = false, bannerCase, busy, onCreateInInventory} = props
  const {t} = useTranslation(structureLocaleNamespace)
  const visible = state === current
  let className: string | undefined
  if (stacked) className = visible ? sentence : hiddenSentence
  return (
    <Text
      size={1}
      as="div"
      trim={true}
      aria-hidden={visible ? undefined : true}
      className={className}
      data-testid={visible ? 'document-not-in-variant-banner' : undefined}
      data-case={visible ? bannerCase : undefined}
      inert={visible ? undefined : true}
    >
      <Translate
        // Without the action, the sentence stops before its own instruction ("Create one to start
        // editing"), and the link or the pointer says where to do it instead.
        i18nKey={state === 'button' ? props.i18nKey : props.statementKey}
        t={t}
        values={props.values}
        components={chips}
        componentProps={props.componentProps}
      />
      {state === 'pointer' ? (
        <>
          {' '}
          <span data-testid={visible ? 'document-not-in-variant-banner-hand-off' : undefined}>
            {t('banners.variant.finish-in-document-inventory')}
          </span>
        </>
      ) : null}
      {state === 'link' ? (
        <>
          {' '}
          <button
            className={inlineAction}
            data-testid={visible ? 'document-not-in-variant-banner-inventory-link' : undefined}
            disabled={busy}
            onClick={onCreateInInventory}
            type="button"
          >
            {t('banners.variant.action.create-in-document-inventory')}
          </button>
        </>
      ) : null}
    </Text>
  )
}
