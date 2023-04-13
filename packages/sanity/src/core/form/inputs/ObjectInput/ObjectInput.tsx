import React, {memo, useCallback, useMemo} from 'react'
import {Grid, Stack} from '@sanity/ui'
import {ObjectInputProps} from '../../types'
import {ObjectInputMembers} from '../../members'
import {UnknownFields} from './UnknownFields'

/** @beta */
export const ObjectInput = memo(function ObjectInput(props: ObjectInputProps) {
  const {
    schemaType,
    members,
    onChange,
    renderInput,
    renderField,
    renderItem,
    renderPreview,
    value,
  } = props

  const {columns} = schemaType.options || {}

  const renderedUnknownFields = useMemo(() => {
    if (!schemaType.fields) {
      return null
    }

    const knownFieldNames = schemaType.fields.map((field) => field.name)
    const unknownFields = Object.keys(value || {}).filter(
      (key) => !key.startsWith('_') && !knownFieldNames.includes(key)
    )

    if (unknownFields.length === 0) {
      return null
    }

    return <UnknownFields fieldNames={unknownFields} value={value} onChange={onChange} />
  }, [onChange, schemaType.fields, value])

  const renderObjectMembers = useCallback(
    () => (
      <ObjectInputMembers
        members={members}
        renderInput={renderInput}
        renderField={renderField}
        renderItem={renderItem}
        renderPreview={renderPreview}
      />
    ),
    [members, renderField, renderInput, renderItem, renderPreview]
  )

  if (members.length === 0) {
    return null
  }

  return (
    <Stack space={5}>
      {columns ? (
        <Grid columns={columns} gapX={4} gapY={5}>
          {renderObjectMembers()}
        </Grid>
      ) : (
        renderObjectMembers()
      )}

      {renderedUnknownFields}
    </Stack>
  )
})
