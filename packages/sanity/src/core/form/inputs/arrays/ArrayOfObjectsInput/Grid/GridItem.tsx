import {Box, Card, CardTone, Flex, Menu, MenuButton, Spinner, Text} from '@sanity/ui'
import React, {useCallback, useMemo, useRef} from 'react'
import {SchemaType} from '@sanity/types'
import {CopyIcon as DuplicateIcon, EllipsisHorizontalIcon, TrashIcon} from '@sanity/icons'
import styled from 'styled-components'
import {getSchemaTypeTitle} from '../../../../../schema'
import {Button, MenuItem} from '../../../../../../ui'
import {ObjectItem, ObjectItemProps} from '../../../../types'
import {useScrollIntoViewOnFocusWithin} from '../../../../hooks/useScrollIntoViewOnFocusWithin'
import {useDidUpdate} from '../../../../hooks/useDidUpdate'
import {useChildPresence} from '../../../../studio/contexts/Presence'
import {randomKey} from '../../../../utils/randomKey'
import {FormFieldValidationStatus} from '../../../../components'
import {FieldPresence} from '../../../../../presence'
import {useChildValidation} from '../../../../studio/contexts/Validation'
import {ChangeIndicator} from '../../../../../changeIndicators'
import {CellLayout} from '../../layouts/CellLayout'
import {createProtoArrayValue} from '../createProtoArrayValue'
import {InsertMenu} from '../InsertMenu'
import {FIXME} from '../../../../../FIXME'
import {EditPortal} from '../../../../components/EditPortal'

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

function getTone({
  readOnly,
  hasErrors,
  hasWarnings,
}: {
  readOnly: boolean | undefined
  hasErrors: boolean
  hasWarnings: boolean
}): CardTone {
  if (readOnly) {
    return 'transparent'
  }
  if (hasErrors) {
    return 'critical'
  }
  return hasWarnings ? 'caution' : 'default'
}
const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const
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
    onInsert,
    onFocus,
    onOpen,
    onClose,
    changed,
    focused,
    children,
    inputProps: {renderPreview},
  } = props

  const sortable = !readOnly && parentSchemaType.options?.sortable !== false
  const insertableTypes = parentSchemaType.of

  const previewCardRef = useRef<FIXME | null>(null)

  // this is here to make sure the item is visible if it's being edited behind a modal
  useScrollIntoViewOnFocusWithin(previewCardRef, open)

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus && previewCardRef.current) {
      // Note: if editing an inline item, focus is handled by the item input itself and no ref is being set
      previewCardRef.current?.focus()
    }
  })

  const resolvingInitialValue = (value as any)._resolvingInitialValue

  const handleDuplicate = useCallback(() => {
    onInsert({
      items: [{...value, _key: randomKey()}],
      position: 'after',
    })
  }, [onInsert, value])

  const handleInsert = useCallback(
    (pos: 'before' | 'after', insertType: SchemaType) => {
      onInsert({
        items: [createProtoArrayValue(insertType)],
        position: pos,
      })
    },
    [onInsert],
  )

  const childPresence = useChildPresence(path, true)
  const presence = useMemo(() => {
    return childPresence.length === 0 ? null : (
      <FieldPresence presence={childPresence} maxAvatars={1} />
    )
  }, [childPresence])

  const childValidation = useChildValidation(path, true)
  const validation = useMemo(() => {
    return childValidation.length === 0 ? null : (
      <Box marginLeft={1} paddingX={1} paddingY={3}>
        <FormFieldValidationStatus validation={childValidation} __unstable_showSummary />
      </Box>
    )
  }, [childValidation])

  const hasErrors = childValidation.some((v) => v.level === 'error')
  const hasWarnings = childValidation.some((v) => v.level === 'warning')

  const menu = useMemo(
    () =>
      readOnly ? null : (
        <MenuButton
          button={<Button size="small" mode="bleed" icon={EllipsisHorizontalIcon} />}
          id={`${props.inputId}-menuButton`}
          menu={
            <Menu>
              <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={onRemove} />
              <MenuItem text="Duplicate" icon={DuplicateIcon} onClick={handleDuplicate} />
              <InsertMenu types={insertableTypes} onInsert={handleInsert} />
            </Menu>
          }
          popover={MENU_POPOVER_PROPS}
        />
      ),
    [handleDuplicate, handleInsert, onRemove, insertableTypes, props.inputId, readOnly],
  )

  const tone = getTone({readOnly, hasErrors, hasWarnings})

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
          withBorder: false,
          withShadow: false,
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
          autofocus={focused}
          legacy_referenceElement={previewCardRef.current}
        >
          {children}
        </EditPortal>
      )}
    </>
  )
}
