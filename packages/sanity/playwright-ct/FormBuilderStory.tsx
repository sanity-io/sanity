import {defineArrayMember, defineField, defineType, Path, SanityDocumentLike} from '@sanity/types'
import React, {useCallback, useMemo, useRef, useState} from 'react'
// import {BufferedDocument} from '@sanity/mutator'
import {applyAll} from '../src/core/form/patch/applyPatch'
import {
  createPatchChannel,
  FormBuilder,
  FormBuilderProps,
  getExpandOperations,
  PatchEvent,
  setAtPath,
  StateTree,
  toMutationPatches,
  useFormState,
  useWorkspace,
} from '../exports'
import {Wrapper} from './Wrapper'

const NOOP = () => null

const EMPTY_ARRAY: never[] = []

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'string',
        name: 'title',
        title: 'Title',
      }),
      defineField({
        type: 'array',
        name: 'body',
        of: [
          defineArrayMember({type: 'block'}),
          defineArrayMember({
            name: 'object',
            type: 'object',
            fields: [{type: 'string', name: 'title', title: 'Title'}],
          }),
        ],
      }),
      defineField({
        type: 'string',
        name: 'genre',
        title: 'Genre',
        options: {
          list: [
            {title: 'Sci-Fi', value: 'sci-fi'},
            {title: 'Western', value: 'western'},
          ],
        },
      }),
    ],
  }),
]

export function FormBuilderStory() {
  return (
    <Wrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </Wrapper>
  )
}

function TestForm() {
  const [openPath, onSetOpenPath] = useState<Path>([])
  const [fieldGroupState, onSetFieldGroupState] = useState<StateTree<string>>()
  const [collapsedPaths, onSetCollapsedPath] = useState<StateTree<boolean>>()
  const [collapsedFieldSets, onSetCollapsedFieldSets] = useState<StateTree<boolean>>()
  const [document, setDocument] = useState<SanityDocumentLike>({
    _id: '123',
    _type: 'test',
    title: 'An title',
  })
  const [focusPath, setFocusPath] = useState<Path>(
    () => ['title']
    // params.path ? pathFromString(params.path) : []
  )
  const patchChannel = useMemo(() => createPatchChannel(), [])

  const {schema} = useWorkspace()
  const schemaType = schema.get('test')

  if (!schemaType) {
    throw new Error('missing schema type')
  }

  if (schemaType.jsonType !== 'object') {
    throw new Error('schema type is not an object')
  }

  const formState = useFormState(schemaType, {
    focusPath,
    collapsedPaths: collapsedPaths,
    collapsedFieldSets: collapsedFieldSets,
    comparisonValue: null,
    fieldGroupState: fieldGroupState,
    openPath: openPath,
    presence: EMPTY_ARRAY,
    validation: EMPTY_ARRAY,
    value: document,
  })

  const formStateRef = useRef(formState)
  formStateRef.current = formState

  const handleFocus = useCallback(
    (nextFocusPath: Path) => {
      setFocusPath(nextFocusPath)
    },
    [setFocusPath]
  )

  const handleBlur = useCallback(
    (blurredPath: Path) => {
      setFocusPath([])
    },
    [setFocusPath]
  )

  const patchRef = useRef<(event: PatchEvent) => void>(() => {
    throw new Error('Nope')
  })

  patchRef.current = (event: PatchEvent) => {
    setDocument((currentDocumentValue) => applyAll(currentDocumentValue, event.patches))
    // @todo applyAll works, but is BufferedDocument better somehow?
    // const patcher = new BufferedDocument(document)
    // patcher.arrive(toMutationPatches(event.patches))
    // patch.execute(toMutationPatches(event.patches), initialValue.value)
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
    []
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
    [formStateRef]
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
      id: formState?.id || '',
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
      path: EMPTY_ARRAY,
      presence: EMPTY_ARRAY,
      schemaType: formState?.schemaType || schemaType,
      validation: EMPTY_ARRAY,
      value: formState?.value,
    }),
    [
      formState?.focusPath,
      formState?.focused,
      formState?.groups,
      formState?.id,
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
      patchChannel,
      schemaType,
      setOpenPath,
    ]
  )

  return <FormBuilder {...formBuilderProps} />
}

export default FormBuilderStory
