import React, {memo, useCallback, useMemo} from 'react'
import {Grid, Stack} from '@sanity/ui'
import {ObjectInputProps} from '../../types'
import {ObjectInputMembers} from '../../members'
import {UnknownFields} from './UnknownFields'
import {FieldGroupTabsWrapper} from './ObjectInput.styled'
import {FieldGroupTabs} from './fieldGroups/FieldGroupTabs'

/**
 * @hidden
 * @beta */
export const ObjectInput = memo(function ObjectInput(props: ObjectInputProps) {
  const {
    schemaType,
    groups,
    members,
    onChange,
    renderAnnotation,
    renderBlock,
    renderInlineBlock,
    renderInput,
    renderField,
    renderItem,
    renderPreview,
    level,
    value,
    id,
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
      <ObjectInputMembers
        members={members}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderField={renderField}
        renderInlineBlock={renderInlineBlock}
        renderInput={renderInput}
        renderItem={renderItem}
        renderPreview={renderPreview}
      />
    ),
    [
      members,
      renderAnnotation,
      renderBlock,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
    ]
  )

  if (members.length === 0) {
    return null
  }
  return (
    <Stack space={4}>
      {groups.length > 0 ? (
        <FieldGroupTabsWrapper $level={level} data-testid="field-groups">
          <FieldGroupTabs
            groups={groups}
            inputId={id}
            onClick={onFieldGroupSelect}
            // autofocus is taken care of either by focusPath or focusFirstDescendant in the parent component
            shouldAutoFocus={false}
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
