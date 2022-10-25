import {Box, Card, Flex, Spinner, Text} from '@sanity/ui'
import React, {useMemo} from 'react'
import {getSchemaTypeTitle} from '../../../../../schema'
import {ObjectItem, ObjectItemProps} from '../../../../types'
import {FormFieldValidationStatus} from '../../../../components'
import {FieldPresence} from '../../../../../presence'
import {ChangeIndicator} from '../../../../../changeIndicators'
import {RowLayout} from '../../layouts/RowLayout'
import {EditPortal} from '../../../../components/EditPortal'
import {useArrayItemState} from '../useArrayItemState'
import {useArrayItemTone} from '../useArrayItemTone'
import {ArrayItemMenuButton} from '../ArrayItemMenu/ArrayItemMenuButton'
import {useArrayItemPresence, useArrayItemValidation} from '../useArrayItemComponent'

type PreviewItemProps<Item extends ObjectItem> = Omit<ObjectItemProps<Item>, 'renderDefault'>

const INITIAL_VALUE_CARD_STYLE = {
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  opacity: 0.6,
} as const

const BUTTON_CARD_STYLE = {position: 'relative'} as const

export function PreviewItem<Item extends ObjectItem = ObjectItem>(props: PreviewItemProps<Item>) {
  const {
    schemaType,
    parentSchemaType,
    path,
    readOnly,
    onRemove,
    value,
    open,
    onFocus,
    onOpen,
    onClose,
    changed,
    focused,
    children,
    inputProps: {renderPreview},
  } = props

  const {
    sortable,
    insertableTypes,
    resolvingInitialValue,
    handleDuplicate,
    handleInsert,
    childPresence,
    childValidation,
    previewCardRef,
  } = useArrayItemState(props)

  const presence = useArrayItemPresence(childPresence)
  const validation = useArrayItemValidation(childValidation)

  const menu = useMemo(
    () =>
      readOnly ? null : (
        <ArrayItemMenuButton
          inputId={props.inputId}
          insertableTypes={insertableTypes}
          handleDuplicate={handleDuplicate}
          handleInsert={handleInsert}
          onRemove={onRemove}
        />
      ),
    [handleDuplicate, handleInsert, onRemove, insertableTypes, props.inputId, readOnly]
  )

  const tone = useArrayItemTone({childValidation, readOnly})

  const item = (
    <RowLayout
      menu={menu}
      presence={presence}
      validation={validation}
      tone={tone}
      focused={focused}
      dragHandle={sortable}
      selected={open}
    >
      <Card
        as="button"
        type="button"
        tone="inherit"
        radius={2}
        disabled={resolvingInitialValue}
        padding={1}
        onClick={onOpen}
        ref={previewCardRef}
        onFocus={onFocus}
        __unstable_focusRing
        style={BUTTON_CARD_STYLE}
      >
        {renderPreview({
          schemaType: props.schemaType,
          value: props.value,
          layout: 'default',
        })}
        {resolvingInitialValue && (
          <Card
            style={INITIAL_VALUE_CARD_STYLE}
            tone="transparent"
            radius={2}
            as={Flex}
            // @ts-expect-error composed from as={Flex}
            justify="center"
          >
            <Flex align="center" justify="center" padding={3}>
              <Box marginX={3}>
                <Spinner muted />
              </Box>
              <Text size={1} muted>
                Resolving initial value…
              </Text>
            </Flex>
          </Card>
        )}
      </Card>
    </RowLayout>
  )

  const itemTypeTitle = getSchemaTypeTitle(schemaType)
  return (
    <>
      <ChangeIndicator path={path} isChanged={changed} hasFocus={Boolean(focused)}>
        <Box paddingX={1}>{item}</Box>
      </ChangeIndicator>
      {open && (
        <EditPortal
          header={readOnly ? `View ${itemTypeTitle}` : `Edit ${itemTypeTitle}`}
          type={parentSchemaType?.options?.modal?.type || 'dialog'}
          width={parentSchemaType?.options?.modal?.width ?? 1}
          id={value._key}
          onClose={onClose}
          legacy_referenceElement={previewCardRef.current}
        >
          {children}
        </EditPortal>
      )}
    </>
  )
}
