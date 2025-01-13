/* eslint-disable no-nested-ternary, react/jsx-no-bind */
import {AddDocumentIcon, CopyIcon, TrashIcon} from '@sanity/icons'
import {type SchemaType} from '@sanity/types'
import {Box, Card, type CardTone, Menu} from '@sanity/ui'
import {useCallback, useImperativeHandle, useMemo, useRef, useState} from 'react'

import {MenuButton, MenuItem} from '../../../../../../ui-components'
import {ChangeIndicator} from '../../../../../changeIndicators'
import {ContextMenuButton} from '../../../../../components/contextMenuButton'
import {LoadingBlock} from '../../../../../components/loadingBlock'
import {useTranslation} from '../../../../../i18n'
import {FieldPresence} from '../../../../../presence'
import {getSchemaTypeTitle} from '../../../../../schema'
import {FormFieldValidationStatus} from '../../../../components'
import {EditPortal} from '../../../../components/EditPortal'
import {useDidUpdate} from '../../../../hooks/useDidUpdate'
import {useScrollIntoViewOnFocusWithin} from '../../../../hooks/useScrollIntoViewOnFocusWithin'
import {useChildPresence} from '../../../../studio/contexts/Presence'
import {useChildValidation} from '../../../../studio/contexts/Validation'
import {TreeEditingEnabledProvider, useTreeEditingEnabled} from '../../../../studio/tree-editing'
import {type ObjectItem, type ObjectItemProps} from '../../../../types'
import {randomKey} from '../../../../utils/randomKey'
import {RowLayout} from '../../layouts/RowLayout'
import {createProtoArrayValue} from '../createProtoArrayValue'
import {useInsertMenuMenuItems} from '../InsertMenuMenuItems'

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
const EMPTY_ARRAY: never[] = []
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
    onCopy,
    onFocus,
    onOpen,
    onClose,
    changed,
    focused,
    children,
    inputProps: {renderPreview},
  } = props
  const {t} = useTranslation()

  const treeEditing = useTreeEditingEnabled()
  const treeEditingDisabledByOption = parentSchemaType?.options?.treeEditing === false
  const legacyEditing = treeEditingDisabledByOption || treeEditing.legacyEditing

  // The edit portal should open if the item is open and:
  // - tree array editing is disabled
  // - legacy array editing is enabled (e.g. in a Portable Text editor)
  const openPortal = open && (!treeEditing.enabled || legacyEditing)

  const sortable = parentSchemaType.options?.sortable !== false
  const insertableTypes = parentSchemaType.of

  const [previewCardElement, setPreviewCardElement] = useState<HTMLDivElement | null>(null)
  const previewCardRef = useRef<HTMLDivElement | null>(null)
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
    previewCardRef,
    () => previewCardElement,
    [previewCardElement],
  )

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

  const handleCopy = useCallback(() => {
    onCopy({
      items: [{...value, _key: randomKey()}],
    })
  }, [onCopy, value])

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
  const [contextMenuButtonElement, setContextMenuButtonElement] =
    useState<HTMLButtonElement | null>(null)
  const {insertBefore, insertAfter} = useInsertMenuMenuItems({
    schemaTypes: insertableTypes,
    insertMenuOptions: parentSchemaType.options?.insertMenu,
    onInsert: handleInsert,
    referenceElement: contextMenuButtonElement,
  })

  const disableActions = parentSchemaType.options?.disableActions || EMPTY_ARRAY

  const menuItems = useMemo(() => {
    return [
      !disableActions.includes('remove') && (
        <MenuItem
          key="remove"
          text={t('inputs.array.action.remove')}
          tone="critical"
          icon={TrashIcon}
          onClick={onRemove}
        />
      ),
      !disableActions.includes('copy') && (
        <MenuItem
          key="copy"
          text={t('inputs.array.action.copy')}
          icon={CopyIcon}
          onClick={handleCopy}
        />
      ),
      !disableActions.includes('duplicate') && (
        <MenuItem
          key="duplicate"
          text={t('inputs.array.action.duplicate')}
          icon={AddDocumentIcon}
          onClick={handleDuplicate}
        />
      ),
      !disableActions.includes('add') &&
        !disableActions.includes('addBefore') &&
        insertBefore.menuItem,
      !disableActions.includes('add') &&
        !disableActions.includes('addAfter') &&
        insertAfter.menuItem,
    ].filter(Boolean)
  }, [
    disableActions,
    handleCopy,
    handleDuplicate,
    insertAfter.menuItem,
    insertBefore.menuItem,
    onRemove,
    t,
  ])

  const menu = useMemo(
    () =>
      readOnly || menuItems.length === 0 ? null : (
        <>
          <MenuButton
            ref={setContextMenuButtonElement}
            onOpen={() => {
              insertBefore.send({type: 'close'})
              insertAfter.send({type: 'close'})
            }}
            button={
              <ContextMenuButton
                data-testid="array-item-menu-button"
                selected={insertBefore.state.open || insertAfter.state.open ? true : undefined}
              />
            }
            id={`${props.inputId}-menuButton`}
            menu={<Menu>{menuItems}</Menu>}
            popover={MENU_POPOVER_PROPS}
          />
          {insertBefore.popover}
          {insertAfter.popover}
        </>
      ),
    [menuItems, readOnly, insertBefore, insertAfter, props.inputId],
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
      readOnly={!!readOnly}
    >
      <Card
        as="button"
        type="button"
        tone="inherit"
        radius={1}
        disabled={resolvingInitialValue}
        onClick={onOpen}
        ref={setPreviewCardElement}
        onFocus={onFocus}
        __unstable_focusRing
        style={BUTTON_CARD_STYLE}
      >
        {renderPreview({
          schemaType: props.schemaType,
          value: props.value,
          layout: 'default',
          // Don't do visibility check for virtualized items as the calculation will be incorrect causing it to scroll
          skipVisibilityCheck: true,
        })}

        {resolvingInitialValue && <LoadingBlock fill />}
      </Card>
    </RowLayout>
  )

  const itemTypeTitle = getSchemaTypeTitle(schemaType)

  return (
    <TreeEditingEnabledProvider legacyEditing={treeEditingDisabledByOption}>
      <ChangeIndicator path={path} isChanged={changed} hasFocus={Boolean(focused)}>
        <Box paddingX={1}>{item}</Box>
      </ChangeIndicator>

      {openPortal && (
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
          legacy_referenceElement={previewCardElement}
        >
          {children}
        </EditPortal>
      )}
    </TreeEditingEnabledProvider>
  )
}
