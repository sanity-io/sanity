import {
  type Path,
  type SanityDocument,
  type ValidationContext,
  type ValidationMarker,
} from '@sanity/types'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  createPatchChannel,
  EMPTY_ARRAY,
  FormBuilder,
  type FormBuilderProps,
  type FormNodePresence,
  getExpandOperations,
  type PatchEvent,
  setAtPath,
  type StateTree,
  useFormState,
  useWorkspace,
  validateDocument,
  type Workspace,
} from 'sanity'

import {applyAll} from '../../../../src/core/form/patch/applyPatch'
import {PresenceProvider} from '../../../../src/core/form/studio/contexts/Presence'
import {type FormDocumentValue} from '../../../../src/core/form/types'
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

export function TestForm(props: TestFormProps) {
  const {
    document: documentFromProps,
    focusPath: focusPathFromProps,
    id: idFromProps = 'root',
    onPathFocus: onPathFocusFromProps,
    openPath: openPathFromProps = EMPTY_ARRAY,
    presence: presenceFromProps = EMPTY_ARRAY,
  } = props

  const [validation, setValidation] = useState<ValidationMarker[]>([])
  const [openPath, onSetOpenPath] = useState<Path>(openPathFromProps)
  const [fieldGroupState, onSetFieldGroupState] = useState<StateTree<string>>()
  const [collapsedPaths, onSetCollapsedPath] = useState<StateTree<boolean>>()
  const [collapsedFieldSets, onSetCollapsedFieldSets] = useState<StateTree<boolean>>()
  const [document, setDocument] = useState<SanityDocument>(
    documentFromProps || {
      _id: '123',
      _type: 'test',
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
      _rev: '123',
    },
  )
  const [focusPath, setFocusPath] = useState<Path>(() => focusPathFromProps || [])
  const patchChannel = useMemo(() => createPatchChannel(), [])

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

  if (!schemaType) {
    throw new Error('missing schema type')
  }

  if (schemaType.jsonType !== 'object') {
    throw new Error('schema type is not an object')
  }

  useEffect(() => {
    validateStaticDocument(document, workspace, (result) => setValidation(result))
  }, [document, workspace])

  const formState = useFormState(schemaType, {
    focusPath,
    collapsedPaths,
    collapsedFieldSets,
    comparisonValue: null,
    fieldGroupState,
    openPath,
    presence: presenceFromProps,
    validation,
    value: document,
  })

  const formStateRef = useRef(formState)
  formStateRef.current = formState

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

  const patchRef = useRef<(event: PatchEvent) => void>(() => {
    throw new Error('Nope')
  })

  patchRef.current = (event: PatchEvent) => {
    setDocument((currentDocumentValue) => {
      const result = applyAll(currentDocumentValue, event.patches)

      // Save this to window so we can access it from the test
      window.documentState = result

      return result
    })
  }

  const handleChange = useCallback((event: any) => patchRef.current(event), [])

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

  const formBuilderProps: FormBuilderProps = useMemo(
    () => ({
      // eslint-disable-next-line camelcase
      __internal_patchChannel: patchChannel,
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
    <PresenceProvider presence={presenceFromProps}>
      <FormBuilder {...formBuilderProps} />
    </PresenceProvider>
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
