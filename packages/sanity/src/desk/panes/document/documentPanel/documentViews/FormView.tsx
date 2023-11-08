import {Box, Container, Text, focusFirstDescendant} from '@sanity/ui'
import React, {forwardRef, useEffect, useMemo, useCallback, useState} from 'react'
import {tap} from 'rxjs/operators'
import {LoadingBlock} from '../../../../../ui/loadingBlock'
import {useDocumentPane} from '../../useDocumentPane'
import {useConditionalToast} from './useConditionalToast'
import {
  DocumentMutationEvent,
  DocumentRebaseEvent,
  FormBuilder,
  PatchMsg,
  PresenceOverlay,
  createPatchChannel,
  fromMutationPatches,
  useDocumentPresence,
  useDocumentStore,
} from 'sanity'

interface FormViewProps {
  hidden: boolean
  margins: [number, number, number, number]
}

const preventDefault = (ev: React.FormEvent) => ev.preventDefault()

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
    onBlur,
    onSetCollapsedPath,
    onPathOpen,
    onSetCollapsedFieldSet,
    onSetActiveFieldGroup,
  } = useDocumentPane()
  const documentStore = useDocumentStore()
  const presence = useDocumentPresence(documentId)

  // The `patchChannel` is an INTERNAL publish/subscribe channel that we use to notify form-builder
  // nodes about both remote and local patches.
  // - Used by the Portable Text input to modify selections.
  // - Used by `withDocument` to reset value.
  const patchChannel = useMemo(() => createPatchChannel(), [])

  const isLocked = editState?.transactionSyncLock?.enabled

  useConditionalToast({
    id: `sync-lock-${documentId}`,
    status: 'warning',
    enabled: isLocked,
    title: `Syncing document…`,
    description: `Please hold tight while the document is synced. This usually happens right after the document has been published, and it shouldn't take more than a few seconds`,
  })

  useEffect(() => {
    const sub = documentStore.pair
      .documentEvents(documentId, documentType)
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
  }, [documentId, documentStore, documentType, patchChannel])

  const hasRev = Boolean(value?._rev)
  useEffect(() => {
    if (hasRev) {
      // this is a workaround for an issue that caused the document pushed to withDocument to get
      // stuck at the first initial value.
      // This effect is triggered only when the document goes from not having a revision, to getting one
      // so it will kick in as soon as the document is received from the backend
      patchChannel.publish({
        type: 'mutation',
        patches: [],
        snapshot: value,
      })
    }
    // React to changes in hasRev only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRev])

  const [formRef, setFormRef] = useState<null | HTMLDivElement>(null)

  useEffect(() => {
    // Only focus on the first descendant if there is not already a focus path
    // This is to avoid stealing focus from intent links
    if (ready && !formState?.focusPath.length && formRef) {
      focusFirstDescendant(formRef)
    }
    // We only want to run it on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

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

  // const after = useMemo(
  //   () =>
  //     Array.isArray(afterEditorComponents) &&
  //     afterEditorComponents.map(
  //       (AfterEditorComponent: React.ComponentType<{documentId: string}>, idx: number) => (
  //         <AfterEditorComponent key={String(idx)} documentId={documentId} />
  //       )
  //     ),
  //   [documentId]
  // )

  if (!ready) {
    return <LoadingBlock />
  }

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
        <Box as="form" onSubmit={preventDefault} ref={setRef}>
          {formState === null ? (
            <Box padding={2}>
              <Text>This form is hidden</Text>
            </Box>
          ) : (
            <FormBuilder
              __internal_fieldActions={fieldActions}
              __internal_patchChannel={patchChannel}
              collapsedFieldSets={collapsedFieldSets}
              collapsedPaths={collapsedPaths}
              focusPath={formState.focusPath}
              changed={formState.changed}
              focused={formState.focused}
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
              presence={presence}
              readOnly={formState.readOnly}
              schemaType={formState.schemaType}
              validation={validation}
              value={formState.value}
            />
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
