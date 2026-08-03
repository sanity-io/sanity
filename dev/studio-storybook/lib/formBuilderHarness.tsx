/**
 * Storybook port of `packages/sanity/test/browser/TestForm.tsx`: a REAL, live
 * `FormBuilder` driven off a mutable in-memory document.
 *
 * Where `FormStub` fakes the form-layer contexts around a single bare input, this
 * harness runs the actual form machinery: `useFormState` resolves real form members
 * from the workspace schema + document value, `validateDocument` produces real
 * validation markers (async, against the schema's own rules), and `FormBuilder`
 * renders the member tree — field chrome, array item rows, per-item validation,
 * presence, reorder handles — exactly as the document pane does. Patches loop back
 * through `applyAll` into local state, so the form is fully editable.
 *
 * The three contexts array item rows die without (the wave-2b findings) are all
 * mounted here, mirroring TestForm's own shell:
 * - `PresenceProvider` — `useChildPresence` throws "Form context not provided" bare
 * - `VirtualizerScrollInstanceProvider` + a scroll container — `VirtualizedArrayList`
 * - `BoundaryElementProvider` — popover/menu boundaries inside rows
 * plus `ChangeIndicatorsTracker` (TestForm gets it from TestWrapper's
 * `ChangeConnectorRoot`; here the tracker alone silences the change-bar reporters —
 * the connector overlay itself is pane chrome and is not rendered).
 *
 * Deviations from the TestForm original: no `window.documentState` bridge (that is
 * a Playwright affordance), document id/type come from props instead of hardcoded
 * `'test'`, and an optional `onDocumentChange` lets stories mirror the live value.
 *
 * Requires `WithStudioProviders` above it (workspace/schema, source, CopyPaste, i18n).
 * Not a Storybook decorator: the harness IS the rendered form (there is no story
 * subtree to wrap) — use it as the story's render root:
 *
 * ```tsx
 * render: () => <FormBuilderHarness documentType="blog" initialDocument={fixture} />
 * ```
 */
import {
  isKeySegment,
  type Path,
  type SanityDocument,
  type ValidationContext,
  type ValidationMarker,
} from '@sanity/types'
import {BoundaryElementProvider, Box} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {ChangeIndicatorsTracker} from '../../../packages/sanity/src/core/changeIndicators/tracker'
import {ScrollContainer} from '../../../packages/sanity/src/core/components/scroll/scrollContainer'
import {type DocumentFieldAction} from '../../../packages/sanity/src/core/config'
import {type Workspace} from '../../../packages/sanity/src/core/config'
import {VirtualizerScrollInstanceProvider} from '../../../packages/sanity/src/core/form/inputs/arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {applyAll} from '../../../packages/sanity/src/core/form/patch/applyPatch'
import {createPatchChannel} from '../../../packages/sanity/src/core/form/patch/PatchChannel'
import {type PatchEvent} from '../../../packages/sanity/src/core/form/patch/PatchEvent'
import {type StateTree} from '../../../packages/sanity/src/core/form/store'
import {setAtPath} from '../../../packages/sanity/src/core/form/store/stateTreeHelper'
import {useFormState} from '../../../packages/sanity/src/core/form/store/useFormState'
import {getExpandOperations} from '../../../packages/sanity/src/core/form/store/utils/getExpandOperations'
import {PresenceProvider} from '../../../packages/sanity/src/core/form/studio/contexts/Presence'
import {
  FormBuilder,
  type FormBuilderProps,
} from '../../../packages/sanity/src/core/form/studio/FormBuilder'
import {type FormDocumentValue} from '../../../packages/sanity/src/core/form/types'
import {useGlobalCopyPasteElementHandler} from '../../../packages/sanity/src/core/hooks/useGlobalCopyPasteElementHandler'
import {type FormNodePresence} from '../../../packages/sanity/src/core/presence'
import {useCopyPaste} from '../../../packages/sanity/src/core/studio/copyPaste/CopyPasteProvider'
import {useSource} from '../../../packages/sanity/src/core/studio/source'
import {useWorkspace} from '../../../packages/sanity/src/core/studio/workspace'
import {EMPTY_ARRAY} from '../../../packages/sanity/src/core/util/empty'
import {validateDocument} from '../../../packages/sanity/src/core/validation/validateDocument'
import {createMockSanityClient} from '../../../packages/sanity/test/mocks/mockSanityClient'
import {useDocsOverlayBoundary} from './docsOverlayBoundary'

const NOOP = () => null

interface FormBuilderHarnessProps {
  /** Document type name from the story's `WithStudioProviders` schema. */
  documentType: string
  /** Initial document value; `_id`/`_type` default from `documentType` when omitted. */
  initialDocument?: Partial<SanityDocument>
  focusPath?: Path
  openPath?: Path
  presence?: FormNodePresence[]
  id?: string
  /** Height of the scroll container (rows virtualize against it). Default 480. */
  height?: number | string
  /** Mirrors the document value: fires on mount with the initial value, then after every applied patch. */
  onDocumentChange?: (document: SanityDocument) => void
}

const Scroller = styled(ScrollContainer)`
  height: 100%;
  overflow: auto;
  position: relative;
  scroll-behavior: smooth;
  outline: none;
`

export function FormBuilderHarness(props: FormBuilderHarnessProps) {
  const {
    documentType,
    initialDocument,
    focusPath: focusPathFromProps,
    openPath: openPathFromProps = EMPTY_ARRAY,
    presence: presenceFromProps = EMPTY_ARRAY,
    id: idFromProps = 'root',
    height = 480,
    onDocumentChange,
  } = props

  const {setDocumentMeta} = useCopyPaste()
  const [wrapperElement, setWrapperElement] = useState<HTMLDivElement | null>(null)
  const [validation, setValidation] = useState<ValidationMarker[]>([])
  const [openPath, onSetOpenPath] = useState<Path>(openPathFromProps)
  const [fieldGroupState, onSetFieldGroupState] = useState<StateTree<string>>()
  const [collapsedPaths, onSetCollapsedPath] = useState<StateTree<boolean>>()
  const [collapsedFieldSets, onSetCollapsedFieldSets] = useState<StateTree<boolean>>()
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)
  const formContainerElement = useRef<HTMLDivElement | null>(null)
  // Null in story mode, where the boundary below stays exactly `documentScrollElement`. On the
  // autodocs surface the form scroller is 78px to 318px tall and shadows the docs decorator's
  // viewport boundary, which reinstates the popover collapse it exists to fix. See
  // lib/docsOverlayBoundary.ts for why this is a private context and not `useBoundaryElement()`.
  const docsOverlayBoundary = useDocsOverlayBoundary()

  const [document, setDocument] = useState<SanityDocument>(() => ({
    _id: `storybook-${documentType}`,
    _type: documentType,
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    _rev: 'storybook-rev-1',
    ...initialDocument,
  }))
  const documentId = document._id
  const [focusPath, setFocusPath] = useState<Path>(() => focusPathFromProps || [])
  const [patchChannel] = useState(() => createPatchChannel())

  useGlobalCopyPasteElementHandler({
    element: wrapperElement,
    focusPath,
    value: document,
  })

  useEffect(() => {
    patchChannel.publish({
      type: 'mutation',
      patches: [],
      snapshot: document,
    })
  }, [document, patchChannel])

  const workspace = useWorkspace()
  const schemaType = workspace.schema.get(documentType)
  const {
    document: {unstable_fieldActions: fieldActionsResolver},
  } = useSource()

  if (!schemaType) {
    throw new Error(`FormBuilderHarness: missing schema type "${documentType}"`)
  }
  if (schemaType.jsonType !== 'object') {
    throw new Error(`FormBuilderHarness: schema type "${documentType}" is not an object`)
  }

  const fieldActions: DocumentFieldAction[] = useMemo(
    () => fieldActionsResolver({documentId, documentType, schemaType}),
    [documentId, documentType, fieldActionsResolver, schemaType],
  )

  useEffect(() => {
    void validateStaticDocument(document, workspace, setValidation)
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
  })

  const formStateRef = useRef(formState)
  useEffect(() => {
    formStateRef.current = formState
  }, [formState])

  const handleFocus = useCallback((nextFocusPath: Path) => {
    setFocusPath(nextFocusPath)

    const lastSegment = nextFocusPath[nextFocusPath.length - 1]
    if (!isKeySegment(lastSegment)) {
      const lastKeyIndex = nextFocusPath.findLastIndex((seg) => isKeySegment(seg))
      const newOpenPath =
        lastKeyIndex >= 0 ? nextFocusPath.slice(0, lastKeyIndex + 1) : nextFocusPath.slice(0, -1)
      onSetOpenPath(newOpenPath)
    }
  }, [])

  const handleBlur = useCallback(() => {
    setFocusPath([])
  }, [])

  const onDocumentChangeRef = useRef(onDocumentChange)
  useEffect(() => {
    onDocumentChangeRef.current = onDocumentChange
  }, [onDocumentChange])

  // Mirrored via an effect (fires on mount with the initial value, then after every
  // applied patch) — state updater functions must stay pure, so the callback cannot
  // live inside `setDocument`.
  useEffect(() => {
    onDocumentChangeRef.current?.(document)
  }, [document])

  const patchRef = useRef<(event: PatchEvent) => void>((event: PatchEvent) => {
    setDocument(
      (currentDocumentValue) => applyAll(currentDocumentValue, event.patches) as SanityDocument,
    )
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

  const setOpenPath = useCallback((path: Path) => {
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
  }, [])

  useEffect(() => {
    setDocumentMeta({
      documentId,
      documentType,
      schemaType,
      onChange: handleChange,
    })
  }, [documentId, documentType, schemaType, handleChange, setDocumentMeta])

  const formBuilderProps: FormBuilderProps = useMemo(
    () => ({
      __internal_patchChannel: patchChannel,
      __internal_fieldActions: fieldActions,
      changed: false,
      changesOpen: false,
      collapsedFieldSets: undefined,
      collapsedPaths: undefined,
      focused: formState?.focused,
      focusPath: formState?.focusPath || EMPTY_ARRAY,
      groups: formState?.groups || EMPTY_ARRAY,
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
      fieldActions,
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
    <div ref={setWrapperElement} style={{height}}>
      <BoundaryElementProvider element={docsOverlayBoundary ?? documentScrollElement}>
        <VirtualizerScrollInstanceProvider
          scrollElement={documentScrollElement}
          containerElement={formContainerElement}
        >
          <PresenceProvider presence={presenceFromProps}>
            <ChangeIndicatorsTracker>
              <Scroller data-testid="storybook-form-scroller" ref={setDocumentScrollElement}>
                <Box ref={formContainerElement}>
                  <FormBuilder {...formBuilderProps} />
                </Box>
              </Scroller>
            </ChangeIndicatorsTracker>
          </PresenceProvider>
        </VirtualizerScrollInstanceProvider>
      </BoundaryElementProvider>
    </div>
  )
}

const client = createMockSanityClient() as unknown as ReturnType<ValidationContext['getClient']>
const getClient = () => client

async function validateStaticDocument(
  document: SanityDocument,
  workspace: Workspace,
  setCallback: (result: ValidationMarker[]) => void,
) {
  const result = await validateDocument({
    document,
    workspace,
    getClient,
    getDocumentExists: () => Promise.resolve(true),
  })
  setCallback(result)
}
