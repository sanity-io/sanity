import {type EditableReleaseDocument} from '@sanity/client'
import {
  type FieldDefinition,
  type InitialValueResolverContext,
  type ObjectSchemaType,
  type Schema,
  type ValidationMarker,
} from '@sanity/types'
import {validateItem} from '@sanity/validation/_internal'
import {useEffect, useMemo, useState} from 'react'

import {ChangeIndicatorsTracker} from '../../../changeIndicators/tracker'
import {createPatchChannel} from '../../../form/patch/PatchChannel'
import {useFormState} from '../../../form/store/useFormState'
import {FormBuilder} from '../../../form/studio/FormBuilder'
import {type FormDocumentValue} from '../../../form/types/formDocumentValue'
import {
  useBindFormBuilderState,
  useFormBuilderState,
  useFormPatchHandler,
} from '../../../form/useFormBuilderState'
import {useClient} from '../../../hooks/useClient'
import {useSchema} from '../../../hooks/useSchema'
import {useCurrentUser} from '../../../store/user/hooks'
import {useWorkspace} from '../../../studio/workspace'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {DEFAULT_MAX_RECURSION_DEPTH, resolveInitialValueForType} from '../../../templates/resolve'
import {EMPTY_ARRAY} from '../../../util/empty'
import {isRecord} from '../../../util/isRecord'
import {
  RELEASE_METADATA_FORM_ID,
  RELEASE_METADATA_TYPE_NAME,
  compileReleaseMetadataSchema,
} from '../../metadata/compileReleaseMetadataType'
import {
  asReleaseMetadata,
  mergeReleaseMetadata,
  readFieldValues,
  toReleaseMetadataRecord,
  type ReleaseMetadataRecord,
} from '../../metadata/mergeReleaseMetadata'

const NO_FIELDS: readonly FieldDefinition[] = []
const NO_MARKERS: ValidationMarker[] = []

interface ReleaseMetadataFormProps {
  metadata: EditableReleaseDocument['metadata']
  onChange: (metadata: EditableReleaseDocument['metadata']) => void
  onValidityChange?: (valid: boolean) => void
  readOnly?: boolean
  /**
   * When true, missing keys are written back as soon as `initialValue` resolves.
   * Create and the edit dialog need that. The inline editor leaves it false so
   * opening a release does not save untouched initial values.
   */
  commitInitialValues?: boolean
}

interface CompiledReleaseMetadataSchema {
  schema: Schema
  schemaType: ObjectSchemaType
}

interface ReleaseMetadataFieldsFormProps extends ReleaseMetadataFormProps {
  compiled: CompiledReleaseMetadataSchema
  fieldNames: readonly string[]
}

function formValueFromMetadata(
  metadata: ReleaseMetadataRecord,
  fieldNames: readonly string[],
): FormDocumentValue {
  return {
    _id: RELEASE_METADATA_FORM_ID,
    _type: RELEASE_METADATA_TYPE_NAME,
    ...readFieldValues(metadata, fieldNames),
  }
}

function withInitialValues(
  metadata: ReleaseMetadataRecord,
  fieldNames: readonly string[],
  initialValues: Record<string, unknown> | null,
): ReleaseMetadataRecord {
  const next: ReleaseMetadataRecord = {...metadata}
  if (!initialValues) return next
  for (const name of fieldNames) {
    if (next[name] !== undefined || initialValues[name] === undefined) continue
    next[name] = initialValues[name]
  }
  return next
}

function ReleaseMetadataFieldsForm(
  props: ReleaseMetadataFieldsFormProps,
): React.JSX.Element | null {
  const {
    compiled,
    fieldNames,
    metadata: metadataProp,
    onChange,
    onValidityChange,
    readOnly = false,
    commitInitialValues = true,
  } = props
  const metadata = toReleaseMetadataRecord(metadataProp)
  const {projectId, dataset, i18n} = useWorkspace()
  const currentUser = useCurrentUser()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const builderState = useFormBuilderState()
  const [patchChannel] = useState(() => createPatchChannel())
  const [initialValues, setInitialValues] = useState<Record<string, unknown> | null>(null)
  const [markers, setMarkers] = useState<ValidationMarker[]>(NO_MARKERS)
  const [validationReady, setValidationReady] = useState(false)

  const displayedMetadata = useMemo(
    () => withInitialValues(metadata, fieldNames, initialValues),
    [fieldNames, initialValues, metadata],
  )
  const formValue = useMemo(
    () => formValueFromMetadata(displayedMetadata, fieldNames),
    [displayedMetadata, fieldNames],
  )

  const context = useMemo(
    (): InitialValueResolverContext => ({
      projectId,
      dataset,
      schema: compiled.schema,
      currentUser,
      getClient: () => client,
    }),
    [client, compiled.schema, currentUser, dataset, projectId],
  )

  useEffect(() => {
    let active = true
    void resolveInitialValueForType(
      compiled.schemaType,
      {},
      DEFAULT_MAX_RECURSION_DEPTH,
      context,
    ).then((initial) => {
      if (!active || !isRecord(initial)) return
      setInitialValues(initial)
    })
    return () => {
      active = false
    }
  }, [compiled.schemaType, context])

  useEffect(() => {
    if (!commitInitialValues || !initialValues) return
    const next = withInitialValues(metadata, fieldNames, initialValues)
    const changed = fieldNames.some(
      (name) => metadata[name] === undefined && next[name] !== undefined,
    )
    if (!changed) return
    onChange(asReleaseMetadata(next))
  }, [commitInitialValues, fieldNames, initialValues, metadata, onChange])

  useEffect(() => {
    let active = true
    void validateItem({
      value: formValue,
      path: EMPTY_ARRAY,
      schema: compiled.schema,
      type: compiled.schemaType,
      parent: undefined,
      document: undefined,
      getDocumentExists: undefined,
      environment: 'studio',
      signal: undefined,
      hidden: undefined,
      currentUser,
      i18n,
      getClient: () => client,
    }).then((nextMarkers) => {
      if (!active) return
      setMarkers(nextMarkers)
      setValidationReady(true)
    })
    return () => {
      active = false
    }
  }, [client, compiled.schema, compiled.schemaType, currentUser, formValue, i18n])

  const invalid = markers.some((marker) => marker.level === 'error')
  useEffect(() => {
    onValidityChange?.(!invalid && validationReady)
  }, [invalid, onValidityChange, validationReady])

  const handleChange = useFormPatchHandler(formValue, (next) => {
    if (!isRecord(next)) return
    onChange(asReleaseMetadata(mergeReleaseMetadata(displayedMetadata, next, fieldNames)))
  })

  const formState = useFormState({
    schemaType: compiled.schemaType,
    documentValue: formValue,
    comparisonValue: formValue,
    focusPath: builderState.focusPath,
    openPath: builderState.openPath,
    collapsedPaths: builderState.collapsedPaths,
    collapsedFieldSets: builderState.collapsedFieldSets,
    fieldGroupState: builderState.fieldGroupState,
    presence: EMPTY_ARRAY,
    validation: markers,
    readOnly,
    perspective: 'drafts',
    hasUpstreamVersion: false,
    displayInlineChanges: false,
  })
  useBindFormBuilderState(builderState, formState, true)

  if (!formState) return null

  return (
    <ChangeIndicatorsTracker>
      <FormBuilder
        __internal_patchChannel={patchChannel}
        id="root"
        onChange={handleChange}
        onPathFocus={builderState.onPathFocus}
        onPathBlur={builderState.onPathBlur}
        onPathOpen={builderState.onPathOpen}
        onFieldGroupSelect={builderState.onFieldGroupSelect}
        onSetFieldSetCollapsed={builderState.onSetFieldSetCollapsed}
        onSetPathCollapsed={builderState.onSetPathCollapsed}
        collapsedPaths={builderState.collapsedPaths}
        collapsedFieldSets={builderState.collapsedFieldSets}
        changed={false}
        focusPath={formState.focusPath}
        focused={formState.focused}
        groups={formState.groups}
        validation={markers}
        members={formState.members}
        presence={EMPTY_ARRAY}
        schemaType={compiled.schemaType}
        value={formValue}
        openPath={builderState.openPath}
        readOnly={readOnly}
        hasUpstreamVersion={false}
        hasBaseVariant={false}
        changesOpen={false}
      />
    </ChangeIndicatorsTracker>
  )
}

function ReleaseMetadataFields(
  props: ReleaseMetadataFormProps & {fields: readonly FieldDefinition[]},
): React.JSX.Element | null {
  const {fields} = props
  const schema = useSchema()
  const compiled = useMemo(() => compileReleaseMetadataSchema(fields, schema), [fields, schema])
  const fieldNames = useMemo(
    () => compiled?.schemaType.fields.map((field) => field.name) ?? [],
    [compiled],
  )
  if (!compiled) return null
  return <ReleaseMetadataFieldsForm {...props} compiled={compiled} fieldNames={fieldNames} />
}

export function ReleaseMetadataForm(props: ReleaseMetadataFormProps): React.JSX.Element | null {
  const fields = useWorkspace().releases?.metadata?.fields ?? NO_FIELDS
  if (fields.length === 0) return null
  return <ReleaseMetadataFields {...props} fields={fields} />
}
