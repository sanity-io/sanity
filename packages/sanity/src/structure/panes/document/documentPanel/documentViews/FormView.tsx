import {Box, Flex, focusFirstDescendant, Spinner, Text} from '@sanity/ui'
import {
  type FormEvent,
  forwardRef,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react'
import {tap} from 'rxjs/operators'
import {
  createPatchChannel,
  type DocumentMutationEvent,
  type DocumentRebaseEvent,
  FormBuilder,
  FormContainer,
  type FormDocumentValue,
  FormRow,
  fromMutationPatches,
  type PatchMsg,
  PresenceOverlay,
  useConditionalToast,
  useDocumentPresence,
  useDocumentStore,
  usePerspective,
  useTargetDocument,
  useTranslation,
} from 'sanity'

import {Delay} from '../../../../components'
import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {useDocumentTitle} from '../../useDocumentTitle'
import {FormHeader} from './FormHeader'

interface FormViewProps {
  hidden: boolean
  margins: [number, number, number, number]
}

const preventDefault = (ev: FormEvent) => ev.preventDefault()

export const FormView = forwardRef<HTMLFormElement, FormViewProps>(function FormView(props, ref) {
  const {hidden, margins} = props

  const {
    collapsedFieldSets,
    collapsedPaths,
    displayed: value,
    editState,
    documentId,
    documentType,
    fieldActions,
    onChange,
    validation,
    ready,
    formState,
    onFocus,
    connectionState,
    onBlur,
    onSetCollapsedPath,
    onPathOpen,
    onSetCollapsedFieldSet,
    onSetActiveFieldGroup,
    openPath,
    inspectOpen,
    compareValue,
    hasUpstreamVersion,
    focusPath,
    syncState,
  } = useDocumentPane()
  const {selectedPerspective} = usePerspective()
  const documentStore = useDocumentStore()
  const targetDocument = useTargetDocument(documentId)
  // The scope of the document targeted by the selected perspective (undefined when the document
  // doesn't exist yet, in which case the pair falls back to the draft/published documents).
  const scopeId = targetDocument?._system.scopeId
  const presence = useDocumentPresence(documentId)
  const {title} = useDocumentTitle()
  // The `patchChannel` is an INTERNAL publish/subscribe channel that we use to notify form-builder
  // nodes about both remote and local patches.
  // - Used by the Portable Text input to modify selections.
  // - Used by `withDocument` to reset value.
  const [patchChannel] = useState(() => createPatchChannel())

  const isLocked = editState?.transactionSyncLock?.enabled
  const {t} = useTranslation(structureLocaleNamespace)

  const conditionalToastParams = useMemo(
    () => ({
      id: `sync-lock`,
      status: 'warning' as const,
      enabled: isLocked,
      title: t('document-view.form-view.sync-lock-toast.title'),
      description: t('document-view.form-view.sync-lock-toast.description'),
      closable: true,
    }),
    [isLocked, t],
  )

  useConditionalToast(conditionalToastParams)

  // Staged "changes aren't syncing" toast. Three non-synced states:
  //  - pending:    unsynced + disconnected, warning (editing still open)
  //  - stalled:    unsynced + disconnected for longer, editing locked
  //  - recovering: connection back, flushing the backlog (still locked,
  //                but reassure rather than alarm)
  // One toast id so the states replace each other rather than stack, and
  // it auto-dismisses when the document syncs again.
  const syncToastParams = useMemo(() => {
    const copy = {
      pending: {
        status: 'warning' as const,
        title: t('document-view.form-view.sync-pending.title'),
        description: t('document-view.form-view.sync-pending.description'),
      },
      stalled: {
        status: 'error' as const,
        title: t('document-view.form-view.sync-stalled.title'),
        description: t('document-view.form-view.sync-stalled.description'),
      },
      recovering: {
        status: 'warning' as const,
        title: t('document-view.form-view.sync-recovering.title'),
        description: t('document-view.form-view.sync-recovering.description'),
      },
    }
    // No copy when synced — the toast is disabled, so title/description are
    // never read (useConditionalToast only pushes while `enabled`).
    const active = syncState === 'synced' ? undefined : copy[syncState]
    return {
      id: 'document-sync-state',
      enabled: syncState !== 'synced',
      closable: true,
      ...active,
    }
  }, [syncState, t])

  useConditionalToast(syncToastParams)

  useEffect(() => {
    const sub = documentStore.pair
      .documentEvents(documentId, documentType, scopeId)
      .pipe(
        tap((event) => {
          if (event.type === 'mutation') {
            patchChannel.publish(prepareMutationEvent(event))
          }

          if (event.type === 'rebase') {
            patchChannel.publish(prepareRebaseEvent(event))
          }
        }),
      )
      .subscribe()

    return () => {
      sub.unsubscribe()
    }
  }, [documentId, documentStore, documentType, patchChannel, scopeId])

  const hasRev = Boolean(value?._rev)
  const handleInitialValue = useEffectEvent(() => {
    // this is a workaround for an issue that caused the document pushed to withDocument to get
    // stuck at the first initial value.
    // This effect is triggered only when the document goes from not having a revision, to getting one
    // so it will kick in as soon as the document is received from the backend
    patchChannel.publish({
      type: 'mutation',
      patches: [],
      snapshot: value,
    })
  })
  useEffect(() => {
    if (hasRev) {
      handleInitialValue()
    }
    // React to changes in hasRev only
  }, [hasRev])

  const [formRef, setFormRef] = useState<null | HTMLFormElement>(null)
  const [hasFocusedAnyPath, setHasFocusedAnyPath] = useState(false)

  useEffect(() => {
    // Only auto-focus if no path has been focused yet.
    //
    // This is to avoid stealing focus from intent links, and to prevent
    // auto-focusing the first descendant after blurring a path that was focused
    // for any reason (e.g. by this auto-focus mechanism itself, or by
    // navigating to a deep-link).
    if (!hasFocusedAnyPath && ready && !formState?.focusPath.length && formRef) {
      focusFirstDescendant(formRef)
    }
  }, [hasFocusedAnyPath, formRef, formState?.focusPath.length, ready])

  useEffect(() => {
    if (focusPath.length !== 0) {
      // oxlint-disable-next-line react/react-compiler
      setHasFocusedAnyPath(true)
    }
  }, [focusPath])

  const setRef = useCallback(
    (node: HTMLFormElement | null) => {
      setFormRef(node)
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref],
  )

  const isReadOnly = connectionState === 'reconnecting' || formState?.readOnly || !editState?.ready

  return (
    <FormContainer hidden={hidden}>
      <PresenceOverlay margins={margins}>
        <Box
          as="form"
          onSubmit={preventDefault}
          ref={setRef}
          data-testid="form-view"
          data-read-only={isReadOnly ? 'true' : undefined}
        >
          {connectionState === 'connecting' && !editState?.draft && !editState?.published ? (
            <Delay ms={300}>
              {/* TODO: replace with loading block */}
              <Flex align="center" direction="column" height="fill" justify="center">
                <Spinner muted />
                <Box marginTop={3}>
                  <Text align="center" muted size={1}>
                    {t('document-view.form-view.loading')}
                  </Text>
                </Box>
              </Flex>
            </Delay>
          ) : formState === null || hidden ? (
            <Box padding={2}>
              <Text>{t('document-view.form-view.form-hidden')}</Text>
            </Box>
          ) : (
            <>
              <FormRow>
                <FormHeader
                  documentId={documentId}
                  schemaType={formState.schemaType}
                  title={title}
                />
              </FormRow>
              <FormBuilder
                __internal_fieldActions={fieldActions}
                __internal_inspectOpen={inspectOpen}
                __internal_patchChannel={patchChannel}
                changed={formState.changed}
                collapsedFieldSets={collapsedFieldSets}
                collapsedPaths={collapsedPaths}
                compareValue={compareValue ?? undefined}
                focused={formState.focused}
                focusPath={formState.focusPath}
                groups={formState.groups}
                id="root"
                members={formState.members}
                onChange={onChange}
                onFieldGroupSelect={onSetActiveFieldGroup}
                onPathBlur={onBlur}
                onPathFocus={onFocus}
                onPathOpen={onPathOpen}
                onSetFieldSetCollapsed={onSetCollapsedFieldSet}
                onSetPathCollapsed={onSetCollapsedPath}
                openPath={openPath}
                perspective={selectedPerspective}
                hasUpstreamVersion={hasUpstreamVersion}
                presence={presence}
                readOnly={isReadOnly}
                schemaType={formState.schemaType}
                validation={validation}
                value={
                  // note: the form state doesn't have a typed concept of a "document" value
                  // but these should be compatible
                  formState.value as FormDocumentValue
                }
              />
            </>
          )}
        </Box>
      </PresenceOverlay>
    </FormContainer>
  )
})

function prepareMutationEvent(event: DocumentMutationEvent): PatchMsg {
  const patches = event.mutations.map((mut) => mut.patch).filter(Boolean)

  return {
    type: 'mutation',
    snapshot: event.document,
    patches: fromMutationPatches(event.origin, patches),
  }
}

function prepareRebaseEvent(event: DocumentRebaseEvent): PatchMsg {
  const remotePatches = event.remoteMutations.map((mut) => mut.patch).filter(Boolean)
  const localPatches = event.localMutations.map((mut) => mut.patch).filter(Boolean)

  return {
    type: 'rebase',
    snapshot: event.document,
    patches: fromMutationPatches('remote', remotePatches).concat(
      fromMutationPatches('local', localPatches),
    ),
  }
}
