import {Box, Card, Flex, Spinner, Text} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled from 'styled-components'
import {getSchemaTypeTitle} from '../../../../../schema'
import {ObjectItem, ObjectItemProps} from '../../../../types'
import {ChangeIndicator} from '../../../../../changeIndicators'
import {CellLayout} from '../../layouts/CellLayout'
import {EditPortal} from '../../../../components/EditPortal'
import {useArrayItemState} from '../useArrayItemState'
import {useArrayItemTone} from '../useArrayItemTone'
import {ArrayItemMenuButton} from '../ArrayItemMenu/ArrayItemMenuButton'
import {useArrayItemPresence, useArrayItemValidation} from '../useArrayItemComponent'

type GridItemProps<Item extends ObjectItem> = Omit<ObjectItemProps<Item>, 'renderDefault'>

const PreviewCard = styled(Card)`
  border-top-right-radius: inherit;
  border-top-left-radius: inherit;
  height: 100%;
  position: relative;

  @media (hover: hover) {
    &:hover {
      filter: brightness(95%);
    }
  }

  &:focus:focus-visible {
    box-shadow: 0 0 0 2px var(--card-focus-ring-color);
  }
`

const INITIAL_VALUE_CARD_STYLE = {
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
} as const

export function GridItem<Item extends ObjectItem = ObjectItem>(props: GridItemProps<Item>) {
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
    <CellLayout
      menu={menu}
      presence={presence}
      validation={validation}
      tone={tone}
      radius={2}
      border
      focused={focused}
      dragHandle={sortable}
      selected={open}
    >
      <PreviewCard
        tone="inherit"
        overflow="auto"
        forwardedAs="button"
        data-ui="PreviewCard"
        data-as="button"
        type="button"
        flex={1}
        tabIndex={0}
        disabled={resolvingInitialValue}
        onClick={onOpen}
        ref={previewCardRef}
        onFocus={onFocus}
        __unstable_focusRing
      >
        {renderPreview({
          schemaType,
          value,
          layout: 'media',
        })}
        {resolvingInitialValue && (
          <Card as={Flex} style={INITIAL_VALUE_CARD_STYLE}>
            <Flex align="center" justify="center" gap={1} padding={1}>
              <Box padding={3}>
                <Spinner muted />
              </Box>
              <Text muted size={1}>
                Resolving initial value…
              </Text>
            </Flex>
          </Card>
        )}
      </PreviewCard>
    </CellLayout>
  )

  const itemTypeTitle = getSchemaTypeTitle(schemaType)
  return (
    <>
      <ChangeIndicator path={path} isChanged={changed} hasFocus={Boolean(focused)}>
        {item}
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
