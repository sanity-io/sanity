import {type EditableReleaseDocument} from '@sanity/client'
import {
  type FieldDefinition,
  type InitialValueResolverContext,
  type ObjectSchemaType,
  type Schema,
  type ValidationMarker,
} from '@sanity/types'
import {validateItem} from '@sanity/validation/_internal'
import {useEffect, useMemo, useRef, useState} from 'react'
import {useEffectEvent} from 'use-effect-event'

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
import {useReleaseMetadataFieldsEnabled} from '../../metadata/useReleaseMetadataFieldsEnabled'

const NO_FIELDS: readonly FieldDefinition[] = []
const NO_MARKERS: ValidationMarker[] = []

interface ReleaseMetadataFormProps {
  metadata: EditableReleaseDocument['metadata']
  onChange: (metadata: EditableReleaseDocument['metadata']) => void
  onValidityChange?: (valid: boolean) => void
  readOnly?: boolean
  /**
   * When true, `initialValue` is written once for keys that are absent on mount.
   * Create uses that. Edit leaves an absent key absent.
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

function sameConfiguredFields(
  current: FormDocumentValue,
  next: FormDocumentValue,
  fieldNames: readonly string[],
): boolean {
  for (const name of fieldNames) {
    if (current[name] !== next[name]) return false
  }
  for (const key of Object.keys(current)) {
    if (key === '_id' || key === '_type') continue
    if (!fieldNames.includes(key)) return false
  }
  return true
}

function isSeedableInitialValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== ''
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
  const [settled, setSettled] = useState<{
    value: FormDocumentValue
    markers: ValidationMarker[]
  } | null>(null)
  const requestId = useRef(0)
  const didCommitInitialValues = useRef(false)
  const [seedNames] = useState(
    () =>
      new Set(commitInitialValues ? fieldNames.filter((name) => metadata[name] === undefined) : []),
  )
  // Title and description edits rebuild metadata without touching configured fields.
  // Reusing the form value keeps validateItem from running and Create from disabling.
  const nextFormValue = formValueFromMetadata(metadata, fieldNames)
  const [formValue, setFormValue] = useState(nextFormValue)
  if (!sameConfiguredFields(formValue, nextFormValue, fieldNames)) {
    setFormValue(nextFormValue)
  }
  // A new value is invalid until its own check settles. Old markers must not
  // keep create/save enabled while `validateItem` is still running.
  const markers = settled?.value === formValue ? settled.markers : NO_MARKERS
  const pending = settled?.value !== formValue
  const hasError = markers.some((marker) => marker.level === 'error')
  const valid = !pending && !hasError
  const reportValidity = useEffectEvent((next: boolean) => {
    onValidityChange?.(next)
  })

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
    if (!commitInitialValues || !initialValues || didCommitInitialValues.current) return
    didCommitInitialValues.current = true
    if (seedNames.size === 0) return
    const next: ReleaseMetadataRecord = {...metadata}
    let changed = false
    for (const name of seedNames) {
      if (next[name] !== undefined) continue
      const initial = initialValues[name]
      if (!isSeedableInitialValue(initial)) continue
      next[name] = initial
      changed = true
    }
    if (!changed) return
    onChange(asReleaseMetadata(next))
  }, [commitInitialValues, initialValues, metadata, onChange, seedNames])

  useEffect(() => {
    const id = ++requestId.current
    const value = formValue
    let active = true
    // Pending before the request starts, so a submit in this turn cannot use
    // the previous markers with the new value.
    reportValidity(false)
    void validateItem({
      value,
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
    }).then(
      (nextMarkers) => {
        if (!active || id !== requestId.current) return
        setSettled({value, markers: nextMarkers})
      },
      (error: unknown) => {
        if (!active || id !== requestId.current) return
        if (process.env.NODE_ENV !== 'production') {
          console.error('Release metadata validation failed', error)
        }
      },
    )
    return () => {
      active = false
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- reportValidity is a useEffectEvent and must stay out of the dependency array
  }, [client, compiled.schema, compiled.schemaType, currentUser, formValue, i18n])

  useEffect(() => {
    reportValidity(valid)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- reportValidity is a useEffectEvent and must stay out of the dependency array
  }, [valid])

  const handleChange = useFormPatchHandler(formValue, (next) => {
    if (!isRecord(next)) return
    const merged = mergeReleaseMetadata(metadata, next, fieldNames)
    for (const name of fieldNames) {
      if (metadata[name] !== merged[name]) seedNames.delete(name)
    }
    onValidityChange?.(false)
    onChange(asReleaseMetadata(merged))
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
  const {fields, onValidityChange} = props
  const schema = useSchema()
  const compiled = useMemo(() => compileReleaseMetadataSchema(fields, schema), [fields, schema])
  const fieldNames = useMemo(
    () => compiled?.schemaType.fields.map((field) => field.name) ?? [],
    [compiled],
  )
  useEffect(() => {
    if (compiled) return
    // Nothing accepted, or compilation failed. Do not leave create/save waiting.
    onValidityChange?.(true)
  }, [compiled, onValidityChange])
  if (!compiled) return null
  return <ReleaseMetadataFieldsForm {...props} compiled={compiled} fieldNames={fieldNames} />
}

export function ReleaseMetadataForm(props: ReleaseMetadataFormProps): React.JSX.Element | null {
  const enabled = useReleaseMetadataFieldsEnabled()
  const fields = useWorkspace().releases?.metadata?.fields ?? NO_FIELDS
  const {onValidityChange} = props
  const activeFields = enabled ? fields : NO_FIELDS

  useEffect(() => {
    if (activeFields.length > 0) return
    onValidityChange?.(true)
  }, [activeFields.length, onValidityChange])

  if (activeFields.length === 0) return null
  return <ReleaseMetadataFields {...props} fields={activeFields} />
}
