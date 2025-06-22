import {
  type Path,
  type SanityDocument,
  type ValidationContext,
  type ValidationMarker,
} from '@sanity/types'
import {BoundaryElementProvider, Box} from '@sanity/ui'
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

import {applyAll} from '../../../../src/core/form/patch/applyPatch'
import {PresenceProvider} from '../../../../src/core/form/studio/contexts/Presence'
import type {FormDocumentValue} from '../../../../src/core/form/types/formDocumentValue'
import {createMockSanityClient} from '../../mocks/createMockSanityClient'

const NOOP = () => null

declare global {
  interface Window {
    documentState: any
  }
}

interface TestFormProps {
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
    document: documentFromProps,
    focusPath: focusPathFromProps,
    id: idFromProps = 'root',
    onPathFocus: onPathFocusFromProps,
    openPath: openPathFromProps = EMPTY_ARRAY,
    presence: presenceFromProps = EMPTY_ARRAY,
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
  const documentId = '123'
  const documentType = 'test'
  const [document, setDocument] = useState<SanityDocument>(
    documentFromProps || {
      _id: documentId,
      _type: documentType,
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
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
      setDocument(documentFromProps)

      // Save this to window so we can access it from the test
      window.documentState = documentFromProps
    }
  }, [documentFromProps])

  useEffect(() => {
    if (focusPathFromProps) {
      setFocusPath(focusPathFromProps)
      onSetOpenPath(focusPathFromProps)
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
    document: {
      // actions: documentActions,
      // badges: documentBadges,
      unstable_fieldActions: fieldActionsResolver,
      // unstable_languageFilter: languageFilterResolver,
      // inspectors: inspectorsResolver,
    },
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

  useEffect(() => {
    validateStaticDocument(document, workspace, (result) => setValidation(result))
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
  })

  const formStateRef = useRef(formState)
  useEffect(() => {
    formStateRef.current = formState
  }, [formState])

  const handleFocus = useCallback(
    (nextFocusPath: Path) => {
      setFocusPath(nextFocusPath)
      onPathFocusFromProps?.(nextFocusPath)
    },
    [onPathFocusFromProps],
  )

  const handleBlur = useCallback(() => {
    setFocusPath([])
  }, [setFocusPath])

  const patchRef = useRef<(event: PatchEvent) => void>((event: PatchEvent) => {
    setDocument((currentDocumentValue) => {
      const result = applyAll(currentDocumentValue, event.patches)

      // Save this to window so we can access it from the test
      window.documentState = result

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
      // eslint-disable-next-line camelcase
      __internal_patchChannel: patchChannel,
      // eslint-disable-next-line camelcase
      __internal_fieldActions: fieldActions,
      changed: false,
      changesOpen: false,
      collapsedFieldSets: undefined,
      collapsedPaths: undefined,
      focused: formState?.focused,
      focusPath: formState?.focusPath || EMPTY_ARRAY,
      groups: formState?.groups || EMPTY_ARRAY,
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
              <Box ref={formContainerElement}>
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
) {
  const result = await validateDocument({
    document,
    workspace,
    getClient,
    getDocumentExists: () => Promise.resolve(true),
  })
  setCallback(result)
}

const client = createMockSanityClient() as any as ReturnType<ValidationContext['getClient']>
const getClient = () => client
