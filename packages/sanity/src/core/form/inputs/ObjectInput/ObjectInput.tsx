import {isKeySegment} from '@sanity/types'
import {Stack} from '@sanity/ui'
import {last} from 'lodash'
import {type FocusEvent, Fragment, memo, useCallback, useMemo, useRef} from 'react'
import {styled} from 'styled-components'

import {EMPTY_ARRAY} from '../../../util/empty'
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
    __internal_arrayEditingModal: arrayEditingModal = null,
    groups,
    id,
    members,
    onChange,
    onFieldGroupSelect,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
    schemaType,
    path,
    level,
    value,
    onPathFocus,
  } = props

  const wrapperRef = useRef<HTMLDivElement>(null)
  const {columns} = schemaType.options || {}

  // Object inputs should only be focusable if they are not the root object input
  // This includes if they are in the root of a array block
  const isFocusable = useMemo(() => {
    return id !== 'root' && !(path.length > 0 && isKeySegment(last(path)!))
  }, [id, path])

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

  const handleFocus = useCallback(
    (event: FocusEvent) => {
      if (!isFocusable) {
        return
      }

      // Since the focus event will bubble up to the wrapper, we need to check if the object input is the actual target
      if (event.target === wrapperRef.current) {
        onPathFocus(EMPTY_ARRAY)
      }
    },
    [isFocusable, onPathFocus],
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
    <>
      {arrayEditingModal}

      <RootStack
        space={6}
        tabIndex={isFocusable ? 0 : undefined}
        onFocus={handleFocus}
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
    </>
  )
})
