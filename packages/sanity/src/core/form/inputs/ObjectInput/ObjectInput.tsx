import {Stack} from '@sanity/ui'
import {type FocusEvent, Fragment, memo, useCallback, useMemo, useRef} from 'react'
import {useFormCallbacks} from 'sanity'
import styled from 'styled-components'

import {ObjectInputMembers} from '../../members'
import {type ObjectInputProps} from '../../types'
import {FieldGroupTabs} from './fieldGroups/FieldGroupTabs'
import {AlignedBottomGrid, FieldGroupTabsWrapper} from './ObjectInput.styled'
import {UnknownFields} from './UnknownFields'

const RootStack = styled(Stack)`
  // Disable focus ring for the object block. We instead highlight the left border on the fieldset
  // for level > 0 to signal that you have focused on the object
  &:focus {
    outline: none;
  }
`

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
    path,
    level,
    value,
    id,
    onFieldGroupSelect,
  } = props

  const wrapperRef = useRef<HTMLDivElement>(null)
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

  const {onPathBlur, onPathFocus} = useFormCallbacks()

  const handleBlur = useCallback(
    (event: FocusEvent) => {
      if (id === 'root') {
        return
      }

      // Since the blur event will bubble up to the wrapper, we need to check if the object input is the actual target
      if (event.target === wrapperRef.current) {
        onPathBlur(path)
      }
    },
    [id, path, onPathBlur],
  )

  const handleFocus = useCallback(
    (event: FocusEvent) => {
      if (id === 'root') {
        return
      }

      // Since the focus event will bubble up to the wrapper, we need to check if the object input is the actual target
      if (event.target === wrapperRef.current) {
        onPathFocus(path)
      }
    },
    [id, path, onPathFocus],
  )

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
    <RootStack
      space={6}
      tabIndex={id === 'root' ? undefined : 0}
      onFocus={handleFocus}
      onBlur={handleBlur}
      ref={wrapperRef}
    >
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
    </RootStack>
  )
})
