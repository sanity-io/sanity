import {Card, Grid, Stack, useToast} from '@sanity/ui'
import {useBoolean, useProps, useSelect} from '@sanity/ui-workshop'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Patcher} from '@sanity/mutator'
import type {SchemaType, ObjectField} from '@sanity/types'
import {PresenceOverlay} from '@sanity/base/presence'
import {
  FormBuilder,
  FormBuilderInput,
  PatchEvent,
} from '../sanity/legacyPartImplementations/form-builder'
import {applyAll} from '../patch/applyPatch'
import {toGradient} from '../sanity/utils/gradientPatchAdapter'
import {
  getDummySchema,
  getDummyDocument,
  schemaListOptions,
  DUMMY_DOCUMENT_ID,
} from './_common/data'
import {TypeTester, FilterFieldInput, FormDebugger, FormBuilderTester} from './_common'

const patchChannel = FormBuilder.createPatchChannel()

export default function ExampleStory() {
  const {setPropValue} = useProps()
  const ref = React.useRef()
  const toast = useToast()
  const isUseMutator = useBoolean('Use Mutator', false, 'Props')
  const [, setFocused] = useState(false)
  const [focusPath, setFocusPath] = useState([])
  const isReadOnly = useBoolean('Read-only', false, 'Props')
  const isFilterFields = useBoolean('Filter Fields', false, 'Props')
  const isHiddenGroup = useBoolean('Hidden Group', false, 'Props')
  const isTypeTester = useBoolean('Type Performance Tester', false, 'Props')
  const includeUnknownField = useBoolean('Unknown Field in Value', false, 'Props')
  const isDebug = useBoolean('Debug', false, 'Props')
  const isChangesOpen = useBoolean('Changes Open', false, 'Props')
  const selectedSchemaKey = useSelect(
    'Schema',
    schemaListOptions,
    Object.values(schemaListOptions)[0],
    'Props'
  )
  const [documentValue, setDocumentValue] = useState<{[key: string]: any}>(getDummyDocument())
  const [fieldFilterSource, setFieldFilterSource] = useState<string>(``)
  const [fieldFilterValue, setFieldFilterValue] = useState<string>(``)
  const EMPTY = []

  const schema = useMemo(() => {
    return getDummySchema({
      schemaKey: selectedSchemaKey,
      hiddenGroup: isHiddenGroup,
    })
  }, [isHiddenGroup, selectedSchemaKey])
  const documentType = useMemo(() => {
    return schema.get('dummy')
  }, [schema])

  const handleChange = useCallback((patchEvent: PatchEvent) => {
    setDocumentValue((currentDocumentValue) => applyAll(currentDocumentValue, patchEvent.patches))
  }, [])
  const handleChangeMutator = useCallback((patchEvent: PatchEvent) => {
    const patcher = new Patcher(
      toGradient(patchEvent.patches).map((patch) => ({...patch, id: DUMMY_DOCUMENT_ID}))
    )
    setDocumentValue((currentDocumentValue) => patcher.apply(currentDocumentValue))
  }, [])
  const handleBlur = useCallback(() => setFocused(false), [])
  const handleFocus = useCallback((path) => {
    setFocusPath(path)
    setFocused(true)
  }, [])
  const handleChangeFieldFilterSource = useCallback((value) => {
    const handledValue = value && value.length > 0 ? value : ``

    setFieldFilterSource(handledValue)
  }, [])
  const handleChangeFieldFilter = useCallback(
    (value) => {
      setFieldFilterValue(value)
      toast.push({
        status: 'success',
        title: value === `` ? `Cleared field filter` : `Updated field filter`,
      })
    },
    [toast]
  )

  const memoizedFieldFilter = useMemo(() => {
    if (!fieldFilterValue || fieldFilterValue.length === 0) {
      return () => true
    }

    try {
      const body = `const [type, field] = args; const result = ${fieldFilterValue}; return result(type, field);`
      // eslint-disable-next-line no-new-func
      const filter = new Function('...args', body)

      return filter
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed filtering`, error)

      return () => true
    }
  }, [fieldFilterValue])

  const fieldFilter = useCallback(
    (type: SchemaType, field: ObjectField) => {
      return memoizedFieldFilter(type, field)
    },
    [memoizedFieldFilter]
  )

  // Remove any remaining field filter if you disable the option
  useEffect(() => {
    if (!isFilterFields && fieldFilterSource.length > 0) {
      setFieldFilterSource(``)
      setFieldFilterValue(``)
      toast.push({status: 'success', title: `Cleared field filter`})
    }
  }, [fieldFilterSource.length, isFilterFields, toast])

  useEffect(() => {
    if (includeUnknownField) {
      setDocumentValue((currentDocumentValue) => ({
        ...currentDocumentValue,
        isPublished: true,
      }))
    } else {
      setDocumentValue((currentDocumentValue) => {
        const newValue = {...currentDocumentValue}
        delete newValue.isPublished

        return newValue
      })
    }
  }, [includeUnknownField])

  useEffect(() => {
    if (includeUnknownField && !documentValue?.isPublished) {
      setPropValue('Unknown Field in Value', false)
    }
  }, [documentValue])

  return (
    <PresenceOverlay>
      <Card padding={4}>
        <Grid columns={isDebug ? [1, 1, 1, 12] : 1} gap={4}>
          <Stack space={4} column={6}>
            {isFilterFields && (
              <FilterFieldInput
                value={fieldFilterSource}
                onChange={handleChangeFieldFilterSource}
                onFilter={handleChangeFieldFilter}
              />
            )}
            {isTypeTester && <TypeTester readOnly={isReadOnly} />}
            <FormBuilderTester
              patchChannel={patchChannel}
              schema={schema}
              value={documentValue}
              isChangesOpen={isChangesOpen}
            >
              <FormBuilderInput
                type={documentType}
                onChange={isUseMutator ? handleChangeMutator : handleChange}
                level={0}
                value={documentValue}
                onFocus={handleFocus}
                onBlur={handleBlur}
                focusPath={focusPath}
                readOnly={isReadOnly}
                isRoot
                filterField={fieldFilter}
                ref={ref}
                path={EMPTY}
              />
            </FormBuilderTester>
          </Stack>
          {isDebug && (
            <Stack space={4} column={6}>
              <FormDebugger value={documentValue} focusPath={focusPath} />
            </Stack>
          )}
        </Grid>
      </Card>
    </PresenceOverlay>
  )
}
