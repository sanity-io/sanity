import React, {memo, useCallback, useMemo} from 'react'
import {Grid, Stack} from '@sanity/ui'
import {ObjectInputProps} from '../../types'
import {ObjectMembers} from '../../members'
import {UnknownFields} from './UnknownFields'
import {FieldGroupTabsWrapper} from './ObjectInput.styled'
import {FieldGroupTabs} from './fieldGroups/FieldGroupTabs'

export const ObjectInput = memo(function ObjectInput(props: ObjectInputProps) {
  const {
    schemaType,
    groups,
    members,
    onChange,
    renderInput,
    renderField,
    renderItem,
    renderPreview,
    level,
    value,
    id,
    path,
    onFieldGroupSelect,
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
      <ObjectMembers
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
      {groups.length > 0 ? (
        <FieldGroupTabsWrapper $level={level} data-testid="field-groups">
          <FieldGroupTabs
            inputId={id}
            onClick={onFieldGroupSelect}
            groups={groups}
            shouldAutoFocus={path.length === 0}
          />
        </FieldGroupTabsWrapper>
      ) : null}

      {columns ? (
        <Grid columns={columns} gap={4} marginTop={1}>
          {renderObjectMembers()}
        </Grid>
      ) : (
        renderObjectMembers()
      )}

      {renderedUnknownFields}
    </Stack>
  )
})
