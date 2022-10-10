import {
  Box,
  Button,
  Card,
  CardTone,
  Flex,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  Spinner,
  Stack,
  Text,
  TextSkeleton,
} from '@sanity/ui'
import React, {useCallback, useMemo, useRef} from 'react'
import {isReference, Reference, ReferenceSchemaType, SchemaType} from '@sanity/types'
import {
  CloseIcon,
  CopyIcon as DuplicateIcon,
  EllipsisVerticalIcon,
  LaunchIcon as OpenInNewTabIcon,
  SyncIcon as ReplaceIcon,
  TrashIcon,
} from '@sanity/icons'
import styled from 'styled-components'
import {ObjectItem, ObjectItemProps, RenderPreviewCallback} from '../../../types'
import {useScrollIntoViewOnFocusWithin} from '../../../hooks/useScrollIntoViewOnFocusWithin'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {useChildPresence} from '../../../studio/contexts/Presence'
import {randomKey} from '../common/randomKey'
import {FormFieldValidationStatus} from '../../../components/formField'
import {FieldPresence} from '../../../../presence'
import {useChildValidation} from '../../../studio/contexts/Validation'
import {ChangeIndicator} from '../../../../changeIndicators'
import {RowLayout} from '../layouts/RowLayout'
import {PreviewReferenceValue} from '../../ReferenceInput/PreviewReferenceValue'
import {useReferenceInfo} from '../../ReferenceInput/useReferenceInfo'
import {createProtoArrayValue} from './createProtoArrayValue'
import {InsertMenu} from './InsertMenu'
import {useReferenceInput} from './_reference/useReferenceInput'

export interface ReferenceItemValue extends Omit<ObjectItem, '_type'>, Omit<Reference, '_key'> {}

interface Props<Item extends ReferenceItemValue>
  extends Omit<ObjectItemProps<ReferenceItemValue>, 'renderDefault'> {
  insertableTypes: SchemaType[]
  value: Item
  schemaType: ReferenceSchemaType
  sortable: boolean
  renderPreview: RenderPreviewCallback
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

const PreviewCard = styled(Card)`
  /* this is a hack to avoid layout jumps while previews are loading
     there's probably better ways of solving this */
  min-height: 35px;

  /* TextWithTone uses its own logic to set color, and we therefore need */
  /* to override this logic in order to set the correct color in different states */
  &[data-selected],
  &[data-pressed],
  &:active {
    [data-ui='TextWithTone'] {
      color: inherit;
    }
  }
`

export function ReferenceItem<Item extends ReferenceItemValue = ReferenceItemValue>(
  props: Props<Item>
) {
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
    insertableTypes,
    inputProps,
  } = props

  const previewCardRef = useRef<HTMLDivElement | null>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)

  const {EditReferenceLink, getReferenceInfo, selectedState} = useReferenceInput({
    path,
    schemaType,
    value,
  })

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
  const loadableReferenceInfo = useReferenceInfo(value?._ref, getReferenceInfo)

  const childPresence = useChildPresence(path)
  const presence = useMemo(() => {
    const itemPresence = props.presence.concat(childPresence)
    return itemPresence.length === 0 ? null : (
      <FieldPresence presence={itemPresence} maxAvatars={1} />
    )
  }, [childPresence, props.presence])

  const childValidation = useChildValidation(path)
  const reference = isReference(value)
  const validation = useMemo(() => {
    const itemValidation = props.validation.concat(childValidation)
    return itemValidation.length === 0 ? null : (
      <Box marginLeft={1} paddingX={1} paddingY={3}>
        <FormFieldValidationStatus validation={itemValidation} __unstable_showSummary={reference} />
      </Box>
    )
  }, [childValidation, props.validation, reference])

  const refTypeName = loadableReferenceInfo.result?.type || value?._strengthenOnPublish?.type

  const refType = refTypeName
    ? schemaType.to.find((toType) => toType.name === refTypeName)
    : undefined
  const pressed = selectedState === 'pressed'
  const selected = selectedState === 'selected'

  const tone = getTone({readOnly, hasErrors, hasWarnings})
  const isEditing = !value._ref || inputProps.focusPath[0] === '_ref'

  const menu = useMemo(
    () =>
      readOnly ? null : (
        <Box marginLeft={1}>
          <MenuButton
            button={<Button paddingY={3} paddingX={2} mode="bleed" icon={EllipsisVerticalIcon} />}
            id={`${inputId}-menuButton`}
            menu={
              <Menu>
                {!readOnly && (
                  <>
                    <MenuItem text="Remove" tone="critical" icon={TrashIcon} onClick={onRemove} />
                    <MenuItem
                      text={value._ref && isEditing ? 'Cancel replace' : 'Replace'}
                      icon={value._ref && isEditing ? CloseIcon : ReplaceIcon}
                      onClick={
                        value._ref && isEditing
                          ? () => inputProps.onFocusPath([])
                          : () => inputProps.onFocusPath(['_ref'])
                      }
                    />
                    <MenuItem text="Duplicate" icon={DuplicateIcon} onClick={handleDuplicate} />
                    <InsertMenu onInsert={handleInsert} types={insertableTypes} />
                  </>
                )}

                {!readOnly && !isEditing && value._ref && <MenuDivider />}
                {!isEditing && value._ref && (
                  <MenuItem
                    as={EditReferenceLink}
                    data-as="a"
                    text="Open in new tab"
                    icon={OpenInNewTabIcon}
                  />
                )}
              </Menu>
            }
            popover={{portal: true, tone: 'default'}}
          />
        </Box>
      ),
    [
      readOnly,
      inputId,
      onRemove,
      value._ref,
      isEditing,
      handleDuplicate,
      handleInsert,
      insertableTypes,
      EditReferenceLink,
      inputProps,
    ]
  )

  const item = (
    <RowLayout
      menu={menu}
      presence={presence}
      validation={validation}
      tone={tone}
      focused={focused}
      dragHandle={sortable}
    >
      {isEditing ? (
        children
      ) : (
        <>
          {loadableReferenceInfo.isLoading ? (
            <Stack space={2} padding={1}>
              <TextSkeleton style={{maxWidth: 320}} radius={1} animated />
              <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} animated />
            </Stack>
          ) : (
            <PreviewCard
              forwardedAs={EditReferenceLink as any}
              tone="inherit"
              radius={2}
              data-as="a"
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              documentId={value?._ref}
              documentType={refType?.name}
              disabled={resolvingInitialValue}
              paddingX={2}
              paddingY={1}
              ref={previewCardRef}
              onFocus={onFocus}
              __unstable_focusRing
              style={{position: 'relative'}}
              selected={selected}
              pressed={pressed}
              data-selected={selected ? true : undefined}
              data-pressed={pressed ? true : undefined}
            >
              <PreviewReferenceValue
                value={value}
                referenceInfo={loadableReferenceInfo}
                renderPreview={props.renderPreview}
                type={schemaType}
              />
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
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
            </PreviewCard>
          )}
        </>
      )}
    </RowLayout>
  )
  return (
    <>
      <ChangeIndicator path={path} isChanged={changed} hasFocus={Boolean(focused)}>
        <Box paddingX={1} paddingY={isEditing ? 1 : 0}>
          {item}
        </Box>
      </ChangeIndicator>
    </>
  )
}
