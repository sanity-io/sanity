import {Schema} from '@sanity/schema'
import {uuid} from '@sanity/uuid'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  createPatchChannel,
  type DocumentDefinition,
  type DocumentPresence,
  type FieldDefinition,
  FormBuilder,
  type FormDocumentValue,
  type ObjectInputProps,
  type ObjectSchemaType,
  type PatchEvent,
  type Path,
  set,
  setAtPath,
  type StateTree,
  toMutationPatches,
  useConnectionState,
  useDocumentOperation,
  useEditState,
  useFormState,
  useSchema,
} from 'sanity'

export const AssetLibraryAssetInput = (
  props: ObjectInputProps,
  customFields: FieldDefinition[],
) => {
  const documentId = useMemo(() => {
    return props.value?.asset?._ref || uuid()
  }, [props.value?.asset?._ref])
  const documentType = 'sanity.asset-library.usage-document'

  const {onChange, changed} = props
  const schema = useSchema()
  const [isReferenced, setIsReferenced] = useState(Boolean(props.value?.asset?._ref))
  const editState = useEditState(documentId, documentType)
  const [isPublished, setIsPublished] = useState(Boolean(props.value?.asset?._ref) || false)
  const initialValue = useMemo(() => ({}), [])

  const usageDocumentSchemaType = useMemo(() => {
    const usageDocumentSchemaTypeBase = schema?._original?.types.find(
      (type) => type.name === documentType,
    )
    if (!usageDocumentSchemaTypeBase) {
      throw new Error(`Could not find schema type for ${documentType}`)
    }
    if (usageDocumentSchemaTypeBase.type !== 'document') {
      throw new Error(`Schema type for ${documentType} is not a document type`)
    }
    const customTypeDef = {
      ...usageDocumentSchemaTypeBase,
      fields: [...(usageDocumentSchemaTypeBase as DocumentDefinition).fields, ...customFields],
    }
    return Schema.compile({
      types: [customTypeDef],
      name: 'assetLibraryUsageType',
    }).get(documentType)
  }, [customFields, schema?._original?.types])

  const [focusPath, setFocusPath] = useState<Path>([])
  const [openPath, setOpenPath] = useState<Path>([])
  const [collapsedPaths, onSetCollapsedPath] = useState<StateTree<boolean>>()
  const [collapsedFieldSets, onSetCollapsedFieldSets] = useState<StateTree<boolean>>()
  const [fieldGroupState, onSetFieldGroupState] = useState<StateTree<string>>()
  const [presence] = useState<DocumentPresence[]>([])
  const connectionState = useConnectionState(documentId, documentType)

  const {patch, publish} = useDocumentOperation(documentId, documentType)

  useEffect(() => {
    patchRef.current = (event: PatchEvent) => {
      patch.execute(toMutationPatches(event.patches), initialValue)
    }
  }, [initialValue, patch])

  const patchRef = useRef<(event: PatchEvent) => void>(() => {
    throw new Error(
      'Attempted to patch the Sanity document during initial render. Input components should only call `onChange()` in an effect or a callback.',
    )
  })

  const ready = editState.ready && connectionState === 'connected'

  const documentValue = editState?.draft || editState?.published || initialValue

  const formState = useFormState({
    schemaType: usageDocumentSchemaType as ObjectSchemaType,
    documentValue,
    comparisonValue: editState?.published || undefined,
    readOnly: false,
    changesOpen: false,
    presence,
    focusPath,
    openPath,
    collapsedPaths,
    collapsedFieldSets,
    fieldGroupState,
    validation: [],
  })

  const handleFocus = useCallback(
    (nextFocusPath: Path) => {
      setFocusPath(nextFocusPath)
      // presenceStore.setLocation([.....
    },
    [setFocusPath],
  )
  const handleBlur = useCallback(() => {
    setFocusPath([])
  }, [])

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

  // The usage document must be published before we can reference it properly
  // TODO: can this be done in a more elegant way? For example using strengthenOnPublish?
  useEffect(() => {
    if (editState.published) {
      setIsPublished(true)
      return
    }
    if (editState.draft && !isPublished) {
      // eslint-disable-next-line no-console
      console.log(`Publishing usage document ${documentId}`)
      publish.execute()
    }
  }, [documentId, editState.draft, editState.published, isPublished, publish])

  const handleChange = useCallback(
    async (event: PatchEvent) => {
      patchRef.current(event)
      if (!changed) {
        // Touch main document so that it can be published if there are no other changes to it
        // eslint-disable-next-line no-console
        console.log('Touching main document')
        onChange([set({_type: 'reference', _ref: documentId}, ['asset'])])
      }
    },
    [changed, documentId, onChange],
  )

  const [patchChannel] = useState(() => createPatchChannel())
  if (formState === null || !ready) {
    return null
  }

  return (
    <>
      <FormBuilder
        __internal_patchChannel={patchChannel}
        collapsedFieldSets={collapsedFieldSets}
        collapsedPaths={collapsedPaths}
        focused={formState.focused}
        focusPath={formState.focusPath}
        id={'assetUsageDocumentForm'}
        onChange={handleChange}
        onFieldGroupSelect={handleSetActiveFieldGroup}
        onPathBlur={handleBlur}
        onPathFocus={handleFocus}
        onPathOpen={setOpenPath}
        onSetFieldSetCollapsed={handleOnSetCollapsedFieldSet}
        onSetPathCollapsed={handleOnSetCollapsedPath}
        presence={formState.presence}
        schemaType={formState.schemaType}
        validation={formState.validation}
        value={formState.value as FormDocumentValue}
        groups={formState.groups}
        members={formState.members}
        changed={formState.changed}
      />
    </>
  )
}
