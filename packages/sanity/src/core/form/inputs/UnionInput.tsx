import {AddIcon} from '@sanity/icons'
import {type SchemaType} from '@sanity/types'
import {Grid} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {Button} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {PatchEvent, set, setIfMissing, unset} from '../patch'
import {type ObjectInputProps, type UnionInputProps} from '../types'
import {createProtoValue} from '../utils/createProtoValue'
import {useInsertMenuPopover} from './arrays/ArrayOfObjectsInput/InsertMenuPopover'
import {InvalidValueInput} from './InvalidValueInput/InvalidValueInput'

/**
 *
 * @hidden
 * @beta
 */
export function UnionInput(props: UnionInputProps) {
  const {elementProps, onChange, path, readOnly, renderInput, schemaType, selectedMember, value} =
    props

  const {t} = useTranslation()
  const [gridElement, setGridElement] = useState<HTMLDivElement | null>(null)
  const [popoverToggleElement, setPopoverToggleElement] = useState<HTMLButtonElement | null>(null)

  const handleSelectType = useCallback(
    (selectedType: SchemaType) => {
      onChange(PatchEvent.from(set(createProtoValue(selectedType))))
    },
    [onChange],
  )

  const insertMenu = useInsertMenuPopover({
    insertMenuProps: {
      ...schemaType.options?.insertMenu,
      schemaTypes: schemaType.of,
      onSelect: handleSelectType,
    },
    popoverProps: {
      placement: 'bottom',
      fallbackPlacements: ['top'],
      matchReferenceWidth: schemaType.options?.insertMenu?.views?.some(
        (view) => view.name === 'grid',
      ),
      referenceBoundary: gridElement,
      referenceElement: popoverToggleElement,
    },
  })

  const handleClear = useCallback(() => {
    onChange(PatchEvent.from(unset()))
  }, [onChange])

  const handleSelectedMemberChange = useCallback(
    (event: Parameters<ObjectInputProps['onChange']>[0]) => {
      if (!selectedMember) return
      onChange(
        PatchEvent.from(event).prepend(setIfMissing(createProtoValue(selectedMember.schemaType))),
      )
    },
    [onChange, selectedMember],
  )

  const selectedInputProps = useMemo((): Omit<ObjectInputProps, 'renderDefault'> | undefined => {
    if (!selectedMember) return undefined

    return {
      elementProps,
      level: selectedMember.level,
      members: selectedMember.members,
      value: selectedMember.value,
      compareValue: selectedMember.compareValue,
      readOnly: selectedMember.readOnly,
      validation: selectedMember.validation,
      presence: selectedMember.presence,
      schemaType: selectedMember.schemaType,
      changed: selectedMember.changed,
      __unstable_computeDiff: selectedMember.__unstable_computeDiff,
      hasUpstreamVersion: selectedMember.hasUpstreamVersion,
      id: selectedMember.id,
      onFieldGroupSelect: props.onFieldGroupSelect,
      onFieldOpen: props.onFieldOpen,
      onFieldClose: props.onFieldClose,
      onFieldCollapse: props.onFieldCollapse,
      onFieldExpand: props.onFieldExpand,
      onFieldSetExpand: props.onFieldSetExpand,
      onFieldSetCollapse: props.onFieldSetCollapse,
      onPathFocus: props.onPathFocus,
      path: selectedMember.path,
      focusPath: selectedMember.focusPath,
      focused: selectedMember.focused,
      groups: selectedMember.groups,
      onChange: handleSelectedMemberChange,
      renderAnnotation: props.renderAnnotation,
      renderBlock: props.renderBlock,
      renderField: props.renderField,
      renderInlineBlock: props.renderInlineBlock,
      renderInput: props.renderInput,
      renderItem: props.renderItem,
      renderPreview: props.renderPreview,
      displayInlineChanges: selectedMember.displayInlineChanges ?? false,
    }
  }, [
    elementProps,
    handleSelectedMemberChange,
    props.onFieldClose,
    props.onFieldCollapse,
    props.onFieldExpand,
    props.onFieldGroupSelect,
    props.onFieldOpen,
    props.onFieldSetCollapse,
    props.onFieldSetExpand,
    props.onPathFocus,
    props.renderAnnotation,
    props.renderBlock,
    props.renderField,
    props.renderInlineBlock,
    props.renderInput,
    props.renderItem,
    props.renderPreview,
    selectedMember,
  ])

  if (value && !selectedMember) {
    return (
      <InvalidValueInput
        value={value}
        actualType={typeof value._type === 'string' ? value._type : 'object'}
        validTypes={schemaType.of.map((memberType) => memberType.name)}
        onChange={onChange}
      />
    )
  }

  if (selectedInputProps) {
    return renderInput(selectedInputProps)
  }

  const addItemI18nKey =
    schemaType.of.length > 1 ? 'inputs.union.action.select-type' : 'inputs.array.action.add-item'

  const insertButtonProps: React.ComponentProps<typeof Button> = {
    icon: AddIcon,
    mode: 'ghost',
    size: 'large',
    text: t(addItemI18nKey),
    disabled: readOnly,
  }

  return (
    <Grid
      ref={setGridElement}
      gap={1}
      style={{gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))'}}
    >
      {schemaType.of.length === 1 ? (
        <Button
          {...insertButtonProps}
          onClick={() => handleSelectType(schemaType.of[0])}
          data-testid="add-single-union-button"
        />
      ) : (
        <>
          <Button
            {...insertButtonProps}
            data-testid="add-multiple-union-button"
            selected={insertMenu.state.open}
            onClick={() => {
              insertMenu.send({type: 'toggle'})
            }}
            ref={setPopoverToggleElement}
          />
          {insertMenu.popover}
        </>
      )}
      {value && !readOnly && (
        <Button mode="bleed" text={t('inputs.array.action.remove')} onClick={handleClear} />
      )}
    </Grid>
  )
}
