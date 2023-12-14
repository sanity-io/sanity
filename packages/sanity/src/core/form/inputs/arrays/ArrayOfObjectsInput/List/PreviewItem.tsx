import {Box, Card, CardTone, Menu} from '@sanity/ui'
import React, {useCallback, useMemo, useRef} from 'react'
import {SchemaType} from '@sanity/types'
import {CopyIcon as DuplicateIcon, TrashIcon} from '@sanity/icons'
import {MenuButton, MenuItem} from '../../../../../../ui'
import {ContextMenuButton} from '../../../../../../ui/contextMenuButton'
import {getSchemaTypeTitle} from '../../../../../schema'
import {ObjectItem, ObjectItemProps} from '../../../../types'
import {useScrollIntoViewOnFocusWithin} from '../../../../hooks/useScrollIntoViewOnFocusWithin'
import {useDidUpdate} from '../../../../hooks/useDidUpdate'
import {useChildPresence} from '../../../../studio/contexts/Presence'
import {randomKey} from '../../../../utils/randomKey'
import {FormFieldValidationStatus} from '../../../../components'
import {FieldPresence} from '../../../../../presence'
import {useChildValidation} from '../../../../studio/contexts/Validation'
import {ChangeIndicator} from '../../../../../changeIndicators'
import {RowLayout} from '../../layouts/RowLayout'
import {createProtoArrayValue} from '../createProtoArrayValue'
import {InsertMenu} from '../InsertMenu'
import {EditPortal} from '../../../../components/EditPortal'
import {LoadingBlock} from '../../../../../../ui/loadingBlock'
import {useTranslation} from '../../../../../i18n'

type PreviewItemProps<Item extends ObjectItem> = Omit<ObjectItemProps<Item>, 'renderDefault'>

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
    onInsert,
    onFocus,
    onOpen,
    onClose,
    changed,
    focused,
    children,
    inputProps: {renderPreview},
  } = props
  const {t} = useTranslation()

  const sortable = !readOnly && parentSchemaType.options?.sortable !== false
  const insertableTypes = parentSchemaType.of

  const previewCardRef = useRef<HTMLDivElement | null>(null)

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
      <Box paddingX={1} paddingY={3}>
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
          button={<ContextMenuButton paddingY={3} />}
          id={`${props.inputId}-menuButton`}
          menu={
            <Menu>
              <MenuItem
                text={t('inputs.array.action.remove')}
                tone="critical"
                icon={TrashIcon}
                onClick={onRemove}
              />
              <MenuItem
                text={t('inputs.array.action.duplicate')}
                icon={DuplicateIcon}
                onClick={handleDuplicate}
              />
              <InsertMenu types={insertableTypes} onInsert={handleInsert} />
            </Menu>
          }
          popover={MENU_POPOVER_PROPS}
        />
      ),
    [handleDuplicate, handleInsert, onRemove, insertableTypes, props.inputId, readOnly, t],
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
        radius={1}
        disabled={resolvingInitialValue}
        onClick={onOpen}
        ref={previewCardRef}
        onFocus={onFocus}
        __unstable_focusRing
        style={BUTTON_CARD_STYLE}
      >
        {renderPreview({
          schemaType: props.schemaType,
          value: props.value,
          layout: 'compact',
          // Don't do visibility check for virtualized items as the calculation will be incorrect causing it to scroll
          skipVisibilityCheck: true,
        })}

        {resolvingInitialValue && <LoadingBlock fill />}
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
          header={
            readOnly
              ? t('inputs.array.action.view', {itemTypeTitle})
              : t('inputs.array.action.edit', {itemTypeTitle})
          }
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
