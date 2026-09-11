import {
  isKeySegment,
  type Path,
  type SanityDocument,
  type ValidationContext,
  type ValidationMarker,
} from '@sanity/types'
import {BoundaryElementProvider} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  createPatchChannel,
  type DocumentFieldAction,
  EMPTY_ARRAY,
  FormBuilder,
  type FormBuilderProps,
  type FormNodePresence,
  getExpandOperations,
  type PatchEvent,
  ScrollContainer,
  setAtPath,
  type StateTree,
  useCopyPaste,
  useFormState,
  useGlobalCopyPasteElementHandler,
  useSource,
  useWorkspace,
  validateDocument,
  VirtualizerScrollInstanceProvider,
  type Workspace,
} from 'sanity'
import {css, styled} from 'styled-components'
import {Box} from 'ui5'

import {applyAll} from '../../src/core/form/patch/applyPatch'
import {PresenceProvider} from '../../src/core/form/studio/contexts/Presence'
import {type FormDocumentValue} from '../../src/core/form/types/formDocumentValue'
import {createMockSanityClient} from './createMockSanityClient'

const NOOP = () => null
const NO_MARKERS: ValidationMarker[] = []

// Tests read the current document value off `window.documentState` (see the
// `waitForDocumentState` helper). Use a narrow cast rather than augmenting the
// global `Window` interface, which conflicts with the DOM lib's required
// members (e.g. `scheduler`) under the type-check config.
const windowWithDocumentState = window as Window & {documentState?: unknown}

interface TestFormProps {
  baseVariantDocument?: SanityDocument
  document?: SanityDocument
  focusPath?: Path
  id?: string
  onPathFocus?: (path: Path) => void
  openPath?: Path
  presence?: FormNodePresence[]
}

const Scroller = styled(ScrollContainer)<{$disabled: boolean}>(({$disabled}) => {
  if ($disabled) {
    return {height: '100%'}
  }

  return css`
    height: 100%;
    overflow: auto;
    position: relative;
    scroll-behavior: smooth;
    outline: none;
  `
})

export function TestForm(props: TestFormProps) {
  const {
    baseVariantDocument,
    document: documentFromProps,
    focusPath: focusPathFromProps,
    id: idFromProps = 'root',
    onPathFocus: onPathFocusFromProps,
    openPath: openPathFromProps = EMPTY_ARRAY,
    presence: presenceFromProps = EMPTY_ARRAY,
  } = props

  const {setDocumentMeta} = useCopyPaste()
  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(null)
  const [validationState, setValidationState] = useState<{
    document: SanityDocument
    markers: ValidationMarker[]
  } | null>(null)
  const [openPath, onSetOpenPath] = useState<Path>(openPathFromProps)
  const [fieldGroupState, onSetFieldGroupState] = useState<StateTree<string>>()
  const [collapsedPaths, onSetCollapsedPath] = useState<StateTree<boolean>>()
  const [collapsedFieldSets, onSetCollapsedFieldSets] = useState<StateTree<boolean>>()
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)
  const formContainerElement = useRef<HTMLDivElement | null>(null)
  const documentId = '123'
  const documentType = 'test'
  const [document, setDocument] = useState<SanityDocument>(
    documentFromProps || {
      _id: documentId,
      _type: documentType,
      // Fixed timestamps keep Chromatic archive DOM deterministic across runs.
      _createdAt: '2024-01-01T00:00:00.000Z',
      _updatedAt: '2024-01-01T00:00:00.000Z',
      _rev: '123',
    },
  )
  const [focusPath, setFocusPath] = useState<Path>(() => focusPathFromProps || [])
  const [patchChannel] = useState(() => createPatchChannel())

  useGlobalCopyPasteElementHandler({
    element: wrapperElement,
    focusPath,
    value: document,
  })

  useEffect(() => {
    if (documentFromProps) {
      // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
      setDocument(documentFromProps)
      windowWithDocumentState.documentState = documentFromProps
    }
  }, [documentFromProps])

  useEffect(() => {
    if (focusPathFromProps) {
      // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
      setFocusPath(focusPathFromProps)

      const lastSegment = focusPathFromProps[focusPathFromProps.length - 1]
      if (isKeySegment(lastSegment)) {
        onSetOpenPath(focusPathFromProps)
      } else {
        const lastKeyIndex = focusPathFromProps.findLastIndex((seg) => isKeySegment(seg))
        const newOpenPath =
          lastKeyIndex >= 0
            ? focusPathFromProps.slice(0, lastKeyIndex + 1)
            : focusPathFromProps.slice(0, -1)
        onSetOpenPath(newOpenPath)
      }
    }
  }, [focusPathFromProps])

  useEffect(() => {
    patchChannel.publish({
      type: 'mutation',
      patches: [],
      snapshot: document,
    })
  }, [document, patchChannel])

  const workspace = useWorkspace()
  const schemaType = workspace.schema.get('test')
  const {
    document: {unstable_fieldActions: fieldActionsResolver},
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  } = useSource()

  if (!schemaType) {
    throw new Error('missing schema type')
  }

  if (schemaType.jsonType !== 'object') {
    throw new Error('schema type is not an object')
  }

  const fieldActions: DocumentFieldAction[] = useMemo(
    () => (schemaType ? fieldActionsResolver({documentId, documentType, schemaType}) : []),
    [documentId, documentType, fieldActionsResolver, schemaType],
  )

  const validation = validationState?.markers ?? NO_MARKERS
  // Every document change starts a validation run that ends in a re-render
  // with the resulting markers. Tests wait on `[data-validation-pending]` (see
  // `waitForPortableTextSelection` and `settleChromaticEndState` in
  // `testHelpers`) so that re-render cannot land in the middle of a keystroke
  // sequence or after the Chromatic capture.
  const validationPending = validationState?.document !== document

  useEffect(() => {
    // Validation is gated on `requestIdleCallback`, so a run for a superseded
    // document would otherwise land whenever the browser next idles and
    // re-render the form with stale markers. Abort it instead.
    const controller = new AbortController()
    void validateStaticDocument(
      document,
      workspace,
      (markers) => setValidationState({document, markers}),
      controller.signal,
    )
    return () => controller.abort()
  }, [document, workspace])

  const formState = useFormState({
    schemaType,
    focusPath,
    collapsedPaths,
    collapsedFieldSets,
    comparisonValue: null,
    fieldGroupState,
    openPath,
    presence: presenceFromProps,
    validation,
    documentValue: document,
    perspective: 'published',
    hasUpstreamVersion: false,
    baseVariantValue: baseVariantDocument,
    hasBaseVariant: Boolean(baseVariantDocument),
  })

  const formStateRef = useRef(formState)
  useEffect(() => {
    formStateRef.current = formState
  }, [formState])

  const handleFocus = useCallback(
    (nextFocusPath: Path) => {
      setFocusPath(nextFocusPath)
      onPathFocusFromProps?.(nextFocusPath)

      const lastSegment = nextFocusPath[nextFocusPath.length - 1]

      if (!isKeySegment(lastSegment)) {
        const lastKeyIndex = nextFocusPath.findLastIndex((seg) => isKeySegment(seg))
        const newOpenPath =
          lastKeyIndex >= 0 ? nextFocusPath.slice(0, lastKeyIndex + 1) : nextFocusPath.slice(0, -1)

        onSetOpenPath(newOpenPath)
      }
    },
    [onPathFocusFromProps],
  )

  const handleBlur = useCallback(() => {
    setFocusPath([])
  }, [setFocusPath])

  const patchRef = useRef<(event: PatchEvent) => void>((event: PatchEvent) => {
    setDocument((currentDocumentValue) => {
      const result = applyAll(currentDocumentValue, event.patches)
      windowWithDocumentState.documentState = result
      return result
    })
  })

  const handleChange = useCallback((event: PatchEvent) => patchRef.current(event), [])

  const handleOnSetCollapsedPath = useCallback((path: Path, collapsed: boolean) => {
    onSetCollapsedPath((prevState) => setAtPath(prevState, path, collapsed))
  }, [])

  const handleOnSetCollapsedFieldSet = useCallback((path: Path, collapsed: boolean) => {
    onSetCollapsedFieldSets((prevState) => setAtPath(prevState, path, collapsed))
  }, [])

  const handleSetActiveFieldGroup = useCallback(
    (path: Path, groupName: string) =>
      onSetFieldGroupState((prevState) => setAtPath(prevState, path, groupName)),
    [],
  )

  const setOpenPath = useCallback(
    (path: Path) => {
      const ops = getExpandOperations(formStateRef.current!, path)
      ops.forEach((op) => {
        if (op.type === 'expandPath') {
          onSetCollapsedPath((prevState) => setAtPath(prevState, op.path, false))
        }
        if (op.type === 'expandFieldSet') {
          onSetCollapsedFieldSets((prevState) => setAtPath(prevState, op.path, false))
        }
        if (op.type === 'setSelectedGroup') {
          onSetFieldGroupState((prevState) => setAtPath(prevState, op.path, op.groupName))
        }
      })
      onSetOpenPath(path)
    },
    [formStateRef],
  )

  useEffect(() => {
    setDocumentMeta({
      documentId,
      documentType,
      schemaType: schemaType,
      onChange: handleChange,
    })
  }, [schemaType, handleChange, setDocumentMeta])

  const formBuilderProps: FormBuilderProps = useMemo(
    () => ({
      __internal_patchChannel: patchChannel,
      __internal_fieldActions: fieldActions,
      baseVariantValue: baseVariantDocument,
      changed: false,
      changedFromBaseVariant: formState?.changedFromBaseVariant,
      changesOpen: false,
      collapsedFieldSets: undefined,
      collapsedPaths: undefined,
      focused: formState?.focused,
      focusPath: formState?.focusPath || EMPTY_ARRAY,
      groups: formState?.groups || EMPTY_ARRAY,
      hasBaseVariant: Boolean(baseVariantDocument),
      hasUpstreamVersion: false,
      id: idFromProps,
      level: formState?.level || 0,
      members: formState?.members || EMPTY_ARRAY,
      onChange: handleChange,
      onFieldGroupSelect: NOOP,
      onPathBlur: handleBlur,
      onPathFocus: handleFocus,
      onPathOpen: setOpenPath,
      onSelectFieldGroup: handleSetActiveFieldGroup,
      onSetFieldSetCollapsed: handleOnSetCollapsedFieldSet,
      onSetPathCollapsed: handleOnSetCollapsedPath,
      openPath,
      path: EMPTY_ARRAY,
      presence: presenceFromProps,
      schemaType: formState?.schemaType || schemaType,
      validation,
      value: formState?.value as FormDocumentValue,
    }),
    [
      baseVariantDocument,
      fieldActions,
      formState?.changedFromBaseVariant,
      formState?.focused,
      formState?.focusPath,
      formState?.groups,
      formState?.level,
      formState?.members,
      formState?.schemaType,
      formState?.value,
      handleBlur,
      handleChange,
      handleFocus,
      handleOnSetCollapsedFieldSet,
      handleOnSetCollapsedPath,
      handleSetActiveFieldGroup,
      idFromProps,
      openPath,
      patchChannel,
      presenceFromProps,
      schemaType,
      setOpenPath,
      validation,
    ],
  )
  return (
    <div ref={setWrapperElement}>
      <BoundaryElementProvider element={documentScrollElement}>
        <VirtualizerScrollInstanceProvider
          scrollElement={documentScrollElement}
          containerElement={formContainerElement}
        >
          <PresenceProvider presence={presenceFromProps}>
            <Scroller
              $disabled={false}
              data-testid="document-panel-scroller"
              ref={setDocumentScrollElement}
            >
              <Box
                ref={formContainerElement}
                data-validation-pending={validationPending ? '' : undefined}
              >
                <FormBuilder {...formBuilderProps} />
              </Box>
            </Scroller>
          </PresenceProvider>
        </VirtualizerScrollInstanceProvider>
      </BoundaryElementProvider>
    </div>
  )
}

async function validateStaticDocument(
  document: SanityDocument,
  workspace: Workspace,
  setCallback: (result: ValidationMarker[]) => void,
  signal: AbortSignal,
) {
  let result: ValidationMarker[]
  try {
    result = await validateDocument({
      document,
      workspace,
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      getClient,
      getDocumentExists: () => Promise.resolve(true),
      signal,
    })
  } catch (err) {
    if (signal.aborted) return
    throw err
  }
  if (!signal.aborted) setCallback(result)
}

const client = createMockSanityClient() as any as ReturnType<ValidationContext['getClient']>
const getClient = () => client
