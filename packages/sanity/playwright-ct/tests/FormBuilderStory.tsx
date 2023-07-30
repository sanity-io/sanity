import {
  defineArrayMember,
  defineField,
  defineType,
  Path,
  SanityDocument,
  ValidationContext,
  ValidationMarker,
} from '@sanity/types'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
// import {BufferedDocument} from '@sanity/mutator'
import {validateDocument} from '@sanity/validation'
import {Box} from '@sanity/ui'
import {applyAll} from '../../src/core/form/patch/applyPatch'
import {createMockSanityClient} from './mocks/createMockSanityClient'
import {Wrapper} from './Wrapper'
import {
  createPatchChannel,
  FormBuilder,
  FormBuilderProps,
  getExpandOperations,
  PatchEvent,
  setAtPath,
  StateTree,
  useFormState,
  useWorkspace,
  PreviewProps,
} from 'sanity'

const NOOP = () => null

const EMPTY_ARRAY: never[] = []

// This is to emulate preview updates to the object without the preview store
function CustomObjectPreview(props: PreviewProps) {
  return <Box padding={1}>{props.renderDefault({...props})}</Box>
}

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
        type: 'string',
        name: 'requiredSubtitle',
        title: 'Required Subtitle',
        validation: (Rule) => Rule.required(),
      }),
      defineField({
        type: 'array',
        name: 'body',
        of: [
          defineArrayMember({
            type: 'block',
            of: [
              defineArrayMember({
                type: 'object',
                title: 'Inline Object',
                components: {
                  preview: CustomObjectPreview,
                },
                fields: [
                  defineField({
                    type: 'string',
                    name: 'title',
                    title: 'Title',
                  }),
                ],
              }),
            ],
          }),
          defineArrayMember({
            name: 'object',
            type: 'object',
            title: 'Object',
            fields: [{type: 'string', name: 'title', title: 'Title'}],
            preview: {
              select: {
                title: 'title',
              },
            },
            components: {
              preview: CustomObjectPreview,
            },
          }),
          defineArrayMember({
            name: 'objectWithoutTitle',
            type: 'object',
            fields: [{type: 'string', name: 'title', title: 'Title'}],
            preview: {
              select: {
                title: 'title',
              },
            },
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
      defineField({
        type: 'array',
        name: 'bodyStyles',
        of: [
          defineArrayMember({
            type: 'block',
            styles: [{title: 'Normal', value: 'normal'}],
          }),
          defineArrayMember({
            name: 'object',
            type: 'object',
            title: 'Object',
            fields: [{type: 'string', name: 'title', title: 'Title'}],
            preview: {
              select: {
                title: 'title',
              },
            },
          }),
        ],
      }),
    ],
  }),
]

export function FormBuilderStory({onRender}: {onRender?: () => void}) {
  return (
    <Wrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm onRender={onRender} />
    </Wrapper>
  )
}

const client = createMockSanityClient() as any as ReturnType<ValidationContext['getClient']>
const getClient = (options: {apiVersion: string}) => client

async function validateStaticDocument(
  document: any,
  schema: any,
  setCallback: (result: ValidationMarker[]) => void
) {
  const result = await validateDocument(getClient, document, schema)

  setCallback(result)
}

function TestForm({onRender}: {onRender?: () => void}) {
  const [validation, setValidation] = useState<ValidationMarker[]>([])
  const [openPath, onSetOpenPath] = useState<Path>([])
  const [fieldGroupState, onSetFieldGroupState] = useState<StateTree<string>>()
  const [collapsedPaths, onSetCollapsedPath] = useState<StateTree<boolean>>()
  const [collapsedFieldSets, onSetCollapsedFieldSets] = useState<StateTree<boolean>>()
  const [document, setDocument] = useState<SanityDocument>({
    _id: '123',
    _type: 'test',
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    _rev: '123',
    title: 'Test title',
  })
  const [focusPath, setFocusPath] = useState<Path>(() => ['title'])
  const patchChannel = useMemo(() => createPatchChannel(), [])

  useEffect(() => {
    onRender?.()
  })

  useEffect(() => {
    patchChannel.publish({
      type: 'mutation',
      patches: [],
      snapshot: document,
    })
  }, [document, patchChannel])

  const {schema} = useWorkspace()
  const schemaType = schema.get('test')

  if (!schemaType) {
    throw new Error('missing schema type')
  }

  if (schemaType.jsonType !== 'object') {
    throw new Error('schema type is not an object')
  }

  useEffect(() => {
    validateStaticDocument(document, schema, (result) => setValidation(result))
  }, [document, schema])

  const formState = useFormState(schemaType, {
    focusPath,
    collapsedPaths: collapsedPaths,
    collapsedFieldSets: collapsedFieldSets,
    comparisonValue: null,
    fieldGroupState: fieldGroupState,
    openPath: openPath,
    presence: EMPTY_ARRAY,
    validation,
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
      validation,
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
      validation,
    ]
  )

  return <FormBuilder {...formBuilderProps} />
}

export default FormBuilderStory
