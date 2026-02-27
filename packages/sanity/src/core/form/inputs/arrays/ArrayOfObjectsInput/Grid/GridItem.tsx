import {AddDocumentIcon, CopyIcon, TrashIcon} from '@sanity/icons'
import {type SchemaType, type UploadState} from '@sanity/types'
import {Box, Card, type CardTone, Menu} from '@sanity/ui'
import {useCallback, useImperativeHandle, useMemo, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {MenuButton, MenuItem} from '../../../../../../ui-components'
import {ChangeIndicator} from '../../../../../changeIndicators'
import {ContextMenuButton} from '../../../../../components/contextMenuButton'
import {LoadingBlock} from '../../../../../components/loadingBlock'
import {type FIXME} from '../../../../../FIXME'
import {useTranslation} from '../../../../../i18n'
import {FieldPresence} from '../../../../../presence'
import {getSchemaTypeTitle} from '../../../../../schema'
import {EnhancedObjectDialog, FormFieldValidationStatus} from '../../../../components'
import {EditPortal} from '../../../../components/EditPortal'
import {useDidUpdate} from '../../../../hooks/useDidUpdate'
import {useScrollIntoViewOnFocusWithin} from '../../../../hooks/useScrollIntoViewOnFocusWithin'
import {useChildPresence} from '../../../../studio/contexts/Presence'
import {useChildValidation} from '../../../../studio/contexts/Validation'
import {
  EnhancedObjectDialogProvider,
  useEnhancedObjectDialog,
} from '../../../../studio/tree-editing'
import {UPLOAD_STATUS_KEY} from '../../../../studio/uploads/constants'
import {type ObjectItem, type ObjectItemProps} from '../../../../types'
import {randomKey} from '../../../../utils/randomKey'
import {useArrayValidation} from '../../common/ArrayValidationContext'
import {CellLayout} from '../../layouts/CellLayout'
import {createProtoArrayValue} from '../createProtoArrayValue'
import {useInsertMenuMenuItems} from '../InsertMenuMenuItems'

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
const EMPTY_ARRAY: never[] = []
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
  const arrayValidation = useArrayValidation()
  const maxReached = arrayValidation?.maxReached
  const maxReachedReason = arrayValidation?.maxReachedReason

  const {enabled: enhancedObjectDialogEnabled} = useEnhancedObjectDialog()

  const uploadState = (value as any)[UPLOAD_STATUS_KEY] as UploadState | undefined
  const uploadProgress =
    typeof uploadState?.progress === 'number' ? uploadState?.progress : undefined

  // The edit portal should open if the item is open and:
  // - EnhancedObjectDialog is disabled
  // - the EnhancedObjectDialog is not available
  const openPortal = open && !enhancedObjectDialogEnabled

  const openEnhancedDialog = open && enhancedObjectDialogEnabled

  const sortable = parentSchemaType.options?.sortable !== false
  const insertableTypes = parentSchemaType.of

  const [previewCardElement, setPreviewCardElement] = useState<FIXME | null>(null)
  const previewCardRef = useRef<FIXME | null>(null)
  useImperativeHandle(previewCardRef, () => previewCardElement, [previewCardElement])

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
    disabled: maxReached,
    disabledReason: maxReachedReason,
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
    [readOnly, insertBefore, insertAfter, props.inputId, menuItems],
  )

  const tone = getTone({readOnly, hasErrors, hasWarnings})

  // Prevent default on mousedown to stop focus from shifting before click completes.
  // This fixes a Safari issue where focus events trigger re-renders that interrupt the click.
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
  }, [])

  // Handle click: open the dialog and stop propagation to prevent onClickOutside from firing.
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      onOpen()
    },
    [onOpen],
  )

  const item = (
    <CellLayout
      menu={menu}
      presence={presence}
      validation={validation}
      tone={tone}
      radius={2}
      border
      dragHandle={sortable}
      selected={openPortal}
      readOnly={readOnly}
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
        // Use mousedown to trigger open before focus events cause re-renders.
        // This fixes a Safari-specific issue where the array container receives focus first,
        // triggering a state update that causes a re-render before the click event completes.
        // The click handler checks if already open and stops propagation to prevent
        // the dialog's onClickOutside from detecting this as an "outside" click.
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        ref={setPreviewCardElement}
        onFocus={onFocus}
        __unstable_focusRing
      >
        {renderPreview({
          schemaType,
          value,
          layout: 'media',
          withBorder: false,
          withShadow: false,
          progress: uploadProgress,
        })}

        {resolvingInitialValue && <LoadingBlock fill />}
      </PreviewCard>
    </CellLayout>
  )

  const itemTypeTitle = getSchemaTypeTitle(schemaType)
  return (
    <EnhancedObjectDialogProvider>
      <ChangeIndicator path={path} isChanged={changed} hasFocus={Boolean(focused)}>
        {item}
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
      {openEnhancedDialog && (
        <EnhancedObjectDialog
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
        </EnhancedObjectDialog>
      )}
    </EnhancedObjectDialogProvider>
  )
}
