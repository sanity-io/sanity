import React, {useCallback, useMemo, useRef} from 'react'
import {Reference, ReferenceSchemaType} from '@sanity/types'
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
  Stack,
  Text,
} from '@sanity/ui'
import {
  CloseIcon,
  EllipsisVerticalIcon,
  LaunchIcon as OpenInNewTabIcon,
  SyncIcon as ReplaceIcon,
  TrashIcon,
} from '@sanity/icons'
import {ObjectFieldProps, RenderPreviewCallback} from '../../types'
import {FormField} from '../../components'
import {useReferenceInput} from '../arrays/ArrayOfObjectsInput/_reference/useReferenceInput'
import {useScrollIntoViewOnFocusWithin} from '../../hooks/useScrollIntoViewOnFocusWithin'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {set, unset} from '../../patch'
import {ReferencePreviewCard} from '../arrays/ArrayOfObjectsInput/ReferenceItem'
import {AlertStrip} from '../../components/AlertStrip'
import {useReferenceInfo} from './useReferenceInfo'
import {PreviewReferenceValue} from './PreviewReferenceValue'

interface ReferenceFieldProps extends Omit<ObjectFieldProps, 'renderDefault'> {
  schemaType: ReferenceSchemaType
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

export function ReferenceField(props: ReferenceFieldProps) {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const {schemaType, path, open, inputId, children, inputProps} = props
  const {readOnly, focused, renderPreview, onChange} = props.inputProps

  const handleClear = useCallback(() => inputProps.onChange(unset()), [inputProps])
  const value: Reference | undefined = props.value as any

  const {EditReferenceLink, getReferenceInfo, selectedState, isCurrentDocumentLiveEdit} =
    useReferenceInput({
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

  const loadableReferenceInfo = useReferenceInfo(value?._ref, getReferenceInfo)

  const refTypeName = loadableReferenceInfo.result?.type || value?._strengthenOnPublish?.type

  const refType = refTypeName
    ? schemaType.to.find((toType) => toType.name === refTypeName)
    : undefined
  const pressed = selectedState === 'pressed'
  const selected = selectedState === 'selected'

  const hasRef = value?._ref
  const publishedReferenceExists = hasRef && loadableReferenceInfo.result?.preview?.published?._id

  const handleRemoveStrengthenOnPublish = useCallback(() => {
    onChange([
      schemaType.weak === true ? set(true, ['_weak']) : unset(['_weak']),
      unset(['_strengthenOnPublish']),
    ])
  }, [onChange, schemaType.weak])

  const tone = getTone({readOnly, hasErrors, hasWarnings})
  const isEditing = !value?._ref || inputProps.focusPath[0] === '_ref'

  const footer = isCurrentDocumentLiveEdit &&
    publishedReferenceExists &&
    value._strengthenOnPublish && (
      <AlertStrip
        padding={1}
        title={schemaType.weak ? 'Finalize reference' : 'Convert to strong reference'}
        status="info"
        data-testid="alert-reference-published"
      >
        <Stack space={3}>
          <Text as="p" muted size={1}>
            <strong>{loadableReferenceInfo.result?.preview.published?.title as any}</strong> is
            published and this reference should now be{' '}
            {schemaType.weak ? <>finalized</> : <>converted to a strong reference</>}.
          </Text>
          <Button
            onClick={handleRemoveStrengthenOnPublish}
            text={<>Convert to strong reference</>}
            tone="positive"
          />
        </Stack>
      </AlertStrip>
    )

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
                    <MenuItem text="Clear" tone="critical" icon={TrashIcon} onClick={handleClear} />
                    <MenuItem
                      text={value?._ref && isEditing ? 'Cancel replace' : 'Replace'}
                      icon={value?._ref && isEditing ? CloseIcon : ReplaceIcon}
                      onClick={
                        value?._ref && isEditing
                          ? () => inputProps.onFocusPath([])
                          : () => inputProps.onFocusPath(['_ref'])
                      }
                    />
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
            popover={MENU_POPOVER_PROPS}
          />
        </Box>
      ),
    [readOnly, inputId, handleClear, value?._ref, isEditing, EditReferenceLink, inputProps]
  )
  return (
    <FormField
      level={props.level}
      title={props.title}
      description={props.description}
      validation={props.validation}
      __unstable_presence={props.presence}
    >
      {isEditing ? (
        <Box paddingY={2}>{children}</Box>
      ) : (
        <Card shadow={1} radius={1} padding={1} tone={tone}>
          <Stack space={1}>
            <Flex gap={1} align="center">
              <ReferencePreviewCard
                flex={1}
                forwardedAs={EditReferenceLink as any}
                tone="inherit"
                radius={2}
                data-as="a"
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                documentId={value?._ref}
                documentType={refType?.name}
                paddingX={2}
                paddingY={1}
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
                  renderPreview={renderPreview}
                  type={schemaType}
                />
              </ReferencePreviewCard>
              <Box>{menu}</Box>
            </Flex>
            {footer}
          </Stack>
        </Card>
      )}
    </FormField>
  )
}
