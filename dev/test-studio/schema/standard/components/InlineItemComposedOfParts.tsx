import {
  ArrayItemMenuButton,
  ChangeIndicator,
  FieldPresence,
  FormFieldValidationStatus,
  ObjectItem,
  ObjectItemProps,
  RowLayout,
  useArrayItemPresence,
  useArrayItemState,
  useArrayItemTone,
  useArrayItemValidation,
} from 'sanity'
import React, {useMemo} from 'react'
import {Box, Card, Flex, Spinner, Text} from '@sanity/ui'
import styled from 'styled-components'

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

export function InlineItemComposedOfParts<Item extends ObjectItem = ObjectItem>(
  props: GridItemProps<Item>
) {
  const {path, readOnly, onRemove, open, changed, focused, children} = props

  const {
    sortable,
    insertableTypes,
    resolvingInitialValue,
    handleDuplicate,
    handleInsert,
    childPresence,
    childValidation,
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
      {!resolvingInitialValue && <Card padding={4}>{children}</Card>}
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
    </RowLayout>
  )

  return (
    <ChangeIndicator path={path} isChanged={changed} hasFocus={Boolean(focused)}>
      {item}
    </ChangeIndicator>
  )
}
