import {Stack} from '@sanity/ui'
import {Fragment, memo, useCallback, useMemo} from 'react'

import {ObjectInputMembers} from '../../members'
import {type ObjectInputProps} from '../../types'
import {FieldGroupTabs} from './fieldGroups/FieldGroupTabs'
import {AlignedBottomGrid, FieldGroupTabsWrapper} from './ObjectInput.styled'
import {UnknownFields} from './UnknownFields'

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
      (key) => !key.startsWith('_') && !knownFieldNames.includes(key),
    )

    if (unknownFields.length === 0) {
      return null
    }

    return <UnknownFields fieldNames={unknownFields} value={value} onChange={onChange} />
  }, [onChange, schemaType.fields, value])

  const selectedGroup = useMemo(() => groups.find(({selected}) => selected), [groups])

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
    ],
  )

  if (members.length === 0) {
    return null
  }
  return (
    <Stack space={6}>
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

      <Fragment
        // A key is used here to create a unique element for each selected group. This ensures
        // virtualized descendants are recalculated when the selected group changes.
        key={selectedGroup?.name}
      >
        {columns ? (
          <AlignedBottomGrid columns={columns} gap={4} marginTop={1}>
            {renderObjectMembers()}
          </AlignedBottomGrid>
        ) : (
          renderObjectMembers()
        )}
      </Fragment>

      {renderedUnknownFields}
    </Stack>
  )
})
