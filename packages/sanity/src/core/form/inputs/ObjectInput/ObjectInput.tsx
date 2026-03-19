import {isKeySegment} from '@sanity/types'
import {Card, Grid, Stack, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import last from 'lodash-es/last.js'
import {type FocusEvent, Fragment, memo, useCallback, useMemo, useRef} from 'react'

import {EMPTY_ARRAY} from '../../../util/empty'
import {FormRow} from '../../components'
import {ObjectInputMembers} from '../../members'
import {useRenderMembers} from '../../members/object/useRenderMembers'
import {type ObjectInputProps} from '../../types'
import {FieldGroupTabs} from './fieldGroups/FieldGroupTabs'
import {
  alignedBottomGrid,
  fieldGroupTabsMarginBottomVar,
  fieldGroupTabsWrapper,
} from './ObjectInput.css'
import {UnknownFields} from './UnknownFields'

/**
 * @hidden
 * @beta */
export const ObjectInput = memo(function ObjectInput(props: ObjectInputProps) {
  const {
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

  const renderedMembers = useRenderMembers(schemaType, members)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const {columns} = schemaType.options || {}
  const {space} = useThemeV2()

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

    return (
      <FormRow>
        <UnknownFields
          fieldNames={unknownFields}
          value={value}
          onChange={onChange}
          renderPreview={renderPreview}
        />
      </FormRow>
    )
  }, [onChange, renderPreview, schemaType.fields, value])

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
        members={renderedMembers}
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
      renderedMembers,
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
    <Stack space={6} tabIndex={isFocusable ? 0 : undefined} onFocus={handleFocus} ref={wrapperRef}>
      {groups.length > 0 ? (
        <Card
          className={fieldGroupTabsWrapper}
          style={assignInlineVars({
            // The negative margins here removes the extra space between the tabs and the fields when inside of a grid
            [fieldGroupTabsMarginBottomVar]: `${level === 0 ? 0 : space[5] * -1}px`,
          })}
          paddingBottom={4}
          data-testid="field-groups"
        >
          <FieldGroupTabs
            path={path}
            groups={groups}
            inputId={id}
            onClick={onFieldGroupSelect}
            // autofocus is taken care of either by focusPath or focusFirstDescendant in the parent component
            shouldAutoFocus={false}
          />
        </Card>
      ) : null}

      <Fragment
        // A key is used here to create a unique element for each selected group. This ensures
        // virtualized descendants are recalculated when the selected group changes.
        key={selectedGroup?.name}
      >
        {columns ? (
          <Grid className={alignedBottomGrid} columns={columns} gap={4} marginTop={1}>
            {renderObjectMembers()}
          </Grid>
        ) : (
          renderObjectMembers()
        )}
      </Fragment>
      {renderedUnknownFields}
    </Stack>
  )
})
