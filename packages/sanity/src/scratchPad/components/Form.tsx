import {Path, Schema, ValidationContext, ValidationMarker} from '@sanity/types'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {validateDocument} from '../../core/validation'
import {applyAll} from '../../core/form/patch/applyPatch'
import {useScratchPad} from '../hooks/useScratchPad'
import {
  EMPTY_ARRAY,
  FormBuilder,
  FormBuilderProps,
  getExpandOperations,
  noop,
  PatchEvent,
  setAtPath,
  StateTree,
  useFormState,
} from 'sanity'

/**
 * Form for editing the Portable Text object members
 * as annotations, inline objects, and object blocks.
 *
 * @internal
 */
export function ScratchPadForm({schema}: {schema: Schema}) {
  const [validation, setValidation] = useState<ValidationMarker[]>([])
  const [openPath, onSetOpenPath] = useState<Path>([])
  const [fieldGroupState, onSetFieldGroupState] = useState<StateTree<string>>()
  const [collapsedPaths, onSetCollapsedPath] = useState<StateTree<boolean>>()
  const [collapsedFieldSets, onSetCollapsedFieldSets] = useState<StateTree<boolean>>()
  const {patchChannel, document, setDocument} = useScratchPad()
  const [focusPath, setFocusPath] = useState<Path>(() => [])

  useEffect(() => {
    patchChannel.publish({
      type: 'mutation',
      patches: [],
      snapshot: document,
    })
  }, [document, patchChannel])

  const schemaType = schema.get('scratchPadDocument')

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
    collapsedPaths,
    collapsedFieldSets,
    comparisonValue: null,
    fieldGroupState,
    openPath,
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
    [setFocusPath],
  )

  const handleBlur = useCallback(() => {
    setFocusPath([])
  }, [setFocusPath])

  const patchRef = useRef<(event: PatchEvent) => void>(() => {
    throw new Error('Nope')
  })

  patchRef.current = (event: PatchEvent) => {
    setDocument((currentDocumentValue) => applyAll(currentDocumentValue, event.patches))
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
      id: formState?.id || '',
      level: formState?.level || 0,
      members: formState?.members || EMPTY_ARRAY,
      onChange: handleChange,
      onFieldGroupSelect: noop,
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
    ],
  )
  return <FormBuilder {...formBuilderProps} />
}

async function validateStaticDocument(
  document: any,
  schema: any,
  setCallback: (result: ValidationMarker[]) => void,
) {
  const result = await validateDocument(getClient, document, schema)
  setCallback(result)
}

const client = createMockSanityClient() as any as ReturnType<ValidationContext['getClient']>
const getClient = (options: {apiVersion: string}) => client

export function createMockSanityClient() {
  const _client = {
    fetch: (query: string) => Promise.resolve(null) as Promise<any>,
    withConfig: () => _client,
  }

  return _client
}
