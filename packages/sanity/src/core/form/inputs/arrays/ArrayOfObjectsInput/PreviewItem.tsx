import {
  Box,
  Button,
  Card,
  CardTone,
  Dialog,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  Spinner,
  Text,
} from '@sanity/ui'
import React, {ReactNode, useCallback, useMemo, useRef} from 'react'
import {SchemaType} from '@sanity/types'
import {CopyIcon as DuplicateIcon, EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {getSchemaTypeTitle} from '../../../../schema'
import {ObjectItem, ObjectItemProps} from '../../../types'
import {useScrollIntoViewOnFocusWithin} from '../../../hooks/useScrollIntoViewOnFocusWithin'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {useChildPresence} from '../../../studio/contexts/Presence'
import {randomKey} from '../common/randomKey'
import {FormFieldValidationStatus} from '../../../components'
import {FieldPresence} from '../../../../presence'
import {useChildValidation} from '../../../studio/contexts/Validation'
import {ChangeIndicator} from '../../../../changeIndicators'
import {RowLayout} from '../layouts/RowLayout'
import {createProtoArrayValue} from './createProtoArrayValue'
import {InsertMenu} from './InsertMenu'

interface Props<Item extends ObjectItem> extends Omit<ObjectItemProps<Item>, 'renderDefault'> {
  insertableTypes: SchemaType[]
  value: Item
  preview: ReactNode
  sortable: boolean
}

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

export function PreviewItem<Item extends ObjectItem = ObjectItem>(props: Props<Item>) {
  const {
    schemaType,
    path,
    readOnly,
    onRemove,
    value,
    open,
    onInsert,
    onFocus,
    onOpen,
    onClose,
    inputId,
    changed,
    focused,
    children,
    sortable,
    preview,
    insertableTypes,
  } = props

  const previewCardRef = useRef<HTMLDivElement | null>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)

  // this is here to make sure the item is visible if it's being edited behind a modal
  useScrollIntoViewOnFocusWithin(elementRef, open)

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus && elementRef.current) {
      // Note: if editing an inline item, focus is handled by the item input itself and no ref is being set
      elementRef.current?.focus()
    }
  })

  const hasErrors = props.validation.some((v) => v.level === 'error')
  const hasWarnings = props.validation.some((v) => v.level === 'warning')
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
        items: [{...createProtoArrayValue(insertType), _key: randomKey()}],
        position: pos,
      })
    },
    [onInsert]
  )

  const childPresence = useChildPresence(path)
  const presence = useMemo(() => {
    const itemPresence = props.presence.concat(childPresence)
    return itemPresence.length === 0 ? null : (
      <FieldPresence presence={itemPresence} maxAvatars={1} />
    )
  }, [childPresence, props.presence])

  const childValidation = useChildValidation(path)
  const validation = useMemo(() => {
    const itemValidation = props.validation.concat(childValidation)
    return itemValidation.length === 0 ? null : (
      <Box marginLeft={1} paddingX={1} paddingY={3}>
        <FormFieldValidationStatus validation={itemValidation} />
      </Box>
    )
  }, [childValidation, props.validation])

  const menu = useMemo(
    () =>
      readOnly ? null : (
        <MenuButton
          button={<Button padding={2} mode="bleed" icon={EllipsisVerticalIcon} />}
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
    [handleDuplicate, handleInsert, onRemove, insertableTypes, props.inputId, readOnly]
  )

  const tone = getTone({readOnly, hasErrors, hasWarnings})
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
        paddingX={2}
        paddingY={1}
        onClick={onOpen}
        ref={previewCardRef}
        onFocus={onFocus}
        __unstable_focusRing
        style={{position: 'relative'}}
      >
        {preview}
        {resolvingInitialValue && (
          <Card
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.6,
            }}
            tone="transparent"
            as={Flex}
            radius={2}
            //eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            justify="center"
          >
            <Flex align="center" justify="center" padding={3}>
              <Box marginX={3}>
                <Spinner muted />
              </Box>
              <Text>Resolving initial value…</Text>
            </Flex>
          </Card>
        )}
      </Card>
    </RowLayout>
  )
  return (
    <>
      <ChangeIndicator path={path} isChanged={changed} hasFocus={Boolean(focused)}>
        <Box paddingX={1}>{item}</Box>
      </ChangeIndicator>
      {open && (
        <Dialog
          width={1}
          header={`Edit ${getSchemaTypeTitle(schemaType)}`}
          id={`${inputId}-item-${value._key}-dialog`}
          onClose={onClose}
        >
          <Box padding={4}>{children}</Box>
        </Dialog>
      )}
    </>
  )
}
