import {SanityDocument} from '@sanity/client'
import {isActionEnabled} from '@sanity/schema/_internal'
import {Box, Container, Flex, Spinner, Text} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo} from 'react'
import {tap} from 'rxjs/operators'
import {useDocumentPane} from '../../useDocumentPane'
import {Delay} from '../../../../components/Delay'
// import {afterEditorComponents, filterFieldFn$} from '../../../../TODO'
import {useDocumentStore} from '../../../../../datastores'
import {
  FormBuilderFilterFieldFn,
  fromMutationPatches,
  createPatchChannel,
  PatchMsg,
  SanityFormBuilder,
} from '../../../../../form'
import {
  unstable_useConditionalProperty as useConditionalProperty,
  useDocumentPresence,
} from '../../../../../hooks'
import {PresenceOverlay} from '../../../../../presence'
import {useSource} from '../../../../../studio'
// TODO
import {
  DocumentMutationEvent,
  DocumentRebaseEvent,
} from '../../../../../datastores/document/buffered-doc/types'

interface FormViewProps {
  granted: boolean
  hidden: boolean
  margins: [number, number, number, number]
}

interface FormViewState {
  filterField: FormBuilderFilterFieldFn
}

const INITIAL_STATE: FormViewState = {
  filterField: () => true,
}

const preventDefault = (ev: React.FormEvent) => ev.preventDefault()

export function FormView(props: FormViewProps) {
  const {hidden, margins, granted} = props
  const {schema} = useSource()
  const {
    compareValue,
    displayed: value,
    documentId,
    documentSchema,
    documentType,
    focusPath,
    handleChange: _handleChange,
    handleFocus,
    historyController,
    validation,
    ready,
    changesOpen,
  } = useDocumentPane()
  const documentStore = useDocumentStore()
  const presence = useDocumentPresence(documentId)
  const {revTime: rev} = historyController
  // const [{filterField}, setState] = useState<FormViewState>(INITIAL_STATE)

  const hasTypeMismatch = value !== null && value._type !== documentSchema.name
  const isNonExistent = !value || !value._id

  // The `patchChannel` is an INTERNAL publish/subscribe channel that we use to notify form-builder
  // nodes about both remote and local patches.
  // - Used by the Portable Text input to modify selections.
  // - Used by `withDocument` to reset value.
  const patchChannel = useMemo(() => createPatchChannel(), [])

  const readOnly = useConditionalProperty({
    document: value as SanityDocument,
    value,
    checkProperty: documentSchema.readOnly,
    checkPropertyKey: 'readOnly',
  })

  const isReadOnly = useMemo(() => {
    return (
      !ready ||
      rev !== null ||
      !granted ||
      !isActionEnabled(documentSchema, 'update') ||
      (isNonExistent && !isActionEnabled(documentSchema, 'create')) ||
      readOnly
    )
  }, [documentSchema, isNonExistent, granted, ready, rev, readOnly])

  const handleChange = useCallback(
    (patches) => {
      if (!isReadOnly) _handleChange(patches)
    },
    [_handleChange, isReadOnly]
  )

  // useEffect(() => {
  //   if (!filterFieldFn$) return undefined

  //   const sub = filterFieldFn$.subscribe((nextFilterField) =>
  //     setState({filterField: nextFilterField})
  //   )

  //   return () => sub.unsubscribe()
  // }, [])

  const handleBlur = useCallback(() => {
    // do nothing
  }, [])

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
        })
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
        <Box as="form" onSubmit={preventDefault}>
          {ready ? (
            <SanityFormBuilder
              __internal_patchChannel={patchChannel}
              changesOpen={changesOpen}
              compareValue={compareValue}
              // filterField={filterField}
              focusPath={focusPath}
              onBlur={handleBlur}
              onChange={handleChange}
              onFocus={handleFocus}
              presence={presence}
              readOnly={isReadOnly}
              schema={schema}
              type={documentSchema}
              validation={validation}
              value={value}
            />
          ) : (
            <Delay ms={300}>
              <Flex align="center" direction="column" height="fill" justify="center">
                <Spinner muted />

                <Box marginTop={3}>
                  <Text align="center" muted size={1}>
                    Loading document
                  </Text>
                </Box>
              </Flex>
            </Delay>
          )}
        </Box>
      </PresenceOverlay>
    </Container>
  )
}

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
      fromMutationPatches('local', localPatches)
    ),
  }
}
