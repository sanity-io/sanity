import {Box, Container, Flex, focusFirstDescendant, Spinner, Text} from '@sanity/ui'
import {type FormEvent, forwardRef, useCallback, useEffect, useMemo, useState} from 'react'
import {tap} from 'rxjs/operators'
import {
  createPatchChannel,
  type DocumentMutationEvent,
  type DocumentRebaseEvent,
  FormBuilder,
  type FormDocumentValue,
  fromMutationPatches,
  type PatchMsg,
  PresenceOverlay,
  useConditionalToast,
  useDocumentPresence,
  useDocumentStore,
  usePerspective,
  useTranslation,
} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

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

export const FormView = forwardRef<HTMLDivElement, FormViewProps>(function FormView(props, ref) {
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
  } = useDocumentPane()
  const {selectedReleaseId} = usePerspective()
  const documentStore = useDocumentStore()
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

  useEffect(() => {
    const sub = documentStore.pair
      .documentEvents(documentId, documentType, selectedReleaseId)
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
  }, [documentId, documentStore, documentType, patchChannel, selectedReleaseId])

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

  const [formRef, setFormRef] = useState<null | HTMLDivElement>(null)

  // We only want to run it on first mount
  const [focusedFirstDescendant, setFocusedFirstDescendant] = useState(false)
  useEffect(() => {
    // Only focus on the first descendant if there is not already a focus path
    // This is to avoid stealing focus from intent links
    if (!focusedFirstDescendant && ready && !formState?.focusPath.length && formRef) {
      setFocusedFirstDescendant(true)
      focusFirstDescendant(formRef)
    }
  }, [focusedFirstDescendant, formRef, formState?.focusPath.length, ready])

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
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
    <Container
      hidden={hidden}
      paddingX={4}
      paddingTop={5}
      paddingBottom={9}
      sizing="border"
      width={1}
    >
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
              <FormHeader documentId={documentId} schemaType={formState.schemaType} title={title} />
              <FormBuilder
                __internal_fieldActions={fieldActions}
                __internal_patchChannel={patchChannel}
                changed={formState.changed}
                collapsedFieldSets={collapsedFieldSets}
                collapsedPaths={collapsedPaths}
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
    </Container>
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
