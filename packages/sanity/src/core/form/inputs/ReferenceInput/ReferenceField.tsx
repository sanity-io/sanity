import React, {
  type ComponentProps,
  type ForwardedRef,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {Reference, ReferenceSchemaType} from '@sanity/types'
import {
  Box,
  Card,
  CardTone,
  Flex,
  Menu,
  MenuDivider,
  Stack,
  TooltipDelayGroupProvider,
} from '@sanity/ui'
import {LaunchIcon as OpenInNewTabIcon, SyncIcon as ReplaceIcon, TrashIcon} from '@sanity/icons'
import type {ObjectFieldProps, RenderPreviewCallback} from '../../types'
import {FormField} from '../../components'
import {useScrollIntoViewOnFocusWithin} from '../../hooks/useScrollIntoViewOnFocusWithin'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {set, unset} from '../../patch'
import {FieldActionsProvider, FieldActionsResolver} from '../../field'
import {DocumentFieldActionNode} from '../../../config'
import {usePublishedId} from '../../contexts/DocumentIdProvider'
import {useTranslation} from '../../../i18n'
import {MenuButton, MenuItem} from '../../../../ui-components'
import {ContextMenuButton} from '../../../components/contextMenuButton'
import {TOOLTIP_DELAY_PROPS} from '../../../../ui-components/tooltip/constants'
import {useReferenceInput} from './useReferenceInput'
import {useReferenceInfo} from './useReferenceInfo'
import {PreviewReferenceValue} from './PreviewReferenceValue'
import {ReferenceLinkCard} from './ReferenceLinkCard'
import {ReferenceFinalizeAlertStrip} from './ReferenceFinalizeAlertStrip'
import {ReferenceStrengthMismatchAlertStrip} from './ReferenceStrengthMismatchAlertStrip'
import {ReferenceMetadataLoadErrorAlertStrip} from './ReferenceMetadataLoadFailure'
import {IntentLink} from 'sanity/router'

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

  const [fieldActionsNodes, setFieldActionNodes] = useState<DocumentFieldActionNode[]>([])
  const documentId = usePublishedId()

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
      elementRef.current.focus()
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

  const handleFixStrengthMismatch = useCallback(() => {
    onChange(schemaType.weak === true ? set(true, ['_weak']) : unset(['_weak']))
  }, [onChange, schemaType])

  const handleReplace = useCallback(() => {
    inputProps.onPathFocus(['_ref'])
  }, [inputProps])

  const actualStrength = value?._weak ? 'weak' : 'strong'
  const weakShouldBe = schemaType.weak === true ? 'weak' : 'strong'

  // If the reference value is marked with _strengthenOnPublish,
  // we allow weak references if the reference points to a document that has a draft but not a published
  // In all other cases we should display a "weak mismatch" warning
  const weakWarningOverride =
    hasRef && !loadableReferenceInfo.isLoading && value?._strengthenOnPublish

  const showWeakRefMismatch =
    !loadableReferenceInfo.isLoading &&
    loadableReferenceInfo.result?.availability.available &&
    hasRef &&
    actualStrength !== weakShouldBe &&
    !weakWarningOverride

  const tone = getTone({readOnly, hasErrors, hasWarnings})
  const isEditing = !value?._ref || inputProps.focusPath[0] === '_ref'

  const {t} = useTranslation()

  const footer = (
    <>
      {isCurrentDocumentLiveEdit && publishedReferenceExists && value._strengthenOnPublish && (
        <ReferenceFinalizeAlertStrip
          schemaType={schemaType}
          handleRemoveStrengthenOnPublish={handleRemoveStrengthenOnPublish}
        />
      )}
      {showWeakRefMismatch && (
        <ReferenceStrengthMismatchAlertStrip
          actualStrength={actualStrength}
          handleFixStrengthMismatch={handleFixStrengthMismatch}
        />
      )}
      {loadableReferenceInfo.error && (
        <ReferenceMetadataLoadErrorAlertStrip
          errorMessage={loadableReferenceInfo.error.message}
          onHandleRetry={loadableReferenceInfo.retry!}
        />
      )}
    </>
  )

  const OpenLink = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function OpenLink(
        restProps: ComponentProps<typeof IntentLink>,
        _ref: ForwardedRef<HTMLAnchorElement>,
      ) {
        return (
          <IntentLink
            {...restProps}
            intent="edit"
            params={{id: value?._ref, type: refType?.name}}
            target="_blank"
            rel="noopener noreferrer"
            ref={_ref}
          />
        )
      }),
    [refType?.name, value?._ref],
  )

  const menu = useMemo(
    () =>
      readOnly ? null : (
        <Box flex="none">
          <MenuButton
            button={<ContextMenuButton paddingY={3} />}
            id={`${inputId}-menuButton`}
            menu={
              <Menu>
                {!readOnly && (
                  <>
                    <MenuItem
                      text={t('inputs.reference.action.clear')}
                      tone="critical"
                      icon={TrashIcon}
                      onClick={handleClear}
                    />
                    <MenuItem
                      text={t('inputs.reference.action.replace')}
                      icon={ReplaceIcon}
                      onClick={handleReplace}
                    />
                  </>
                )}

                {!readOnly && value?._ref && <MenuDivider />}
                {value?._ref && (
                  <MenuItem
                    as={OpenLink}
                    data-as="a"
                    text={t('inputs.reference.action.open-in-new-tab')}
                    icon={OpenInNewTabIcon}
                  />
                )}
              </Menu>
            }
            popover={MENU_POPOVER_PROPS}
          />
        </Box>
      ),
    [handleClear, handleReplace, inputId, OpenLink, readOnly, t, value?._ref],
  )

  return (
    <>
      {documentId && props.actions && props.actions.length > 0 && (
        <FieldActionsResolver
          actions={props.actions}
          documentId={documentId}
          documentType={schemaType.name}
          onActions={setFieldActionNodes}
          path={path}
          schemaType={schemaType}
        />
      )}

      <FieldActionsProvider
        actions={fieldActionsNodes}
        focused={Boolean(props.inputProps.focused)}
        path={path}
      >
        <FormField
          __internal_comments={props.__internal_comments}
          __internal_slot={props.__internal_slot}
          __unstable_headerActions={fieldActionsNodes}
          __unstable_presence={props.presence}
          description={props.description}
          level={props.level}
          title={props.title}
          validation={props.validation}
        >
          {isEditing ? (
            <Box>{children}</Box>
          ) : (
            <Card border radius={2} padding={1} tone={tone}>
              <Stack space={1}>
                <Flex gap={1} align="center" style={{lineHeight: 0}}>
                  <TooltipDelayGroupProvider delay={TOOLTIP_DELAY_PROPS}>
                    <ReferenceLinkCard
                      __unstable_focusRing
                      as={EditReferenceLink}
                      data-pressed={pressed ? true : undefined}
                      data-selected={selected ? true : undefined}
                      documentId={value?._ref}
                      documentType={refType?.name}
                      flex={1}
                      pressed={pressed}
                      radius={2}
                      ref={elementRef}
                      selected={selected}
                      tone="inherit"
                    >
                      <PreviewReferenceValue
                        value={value}
                        referenceInfo={loadableReferenceInfo}
                        renderPreview={renderPreview}
                        type={schemaType}
                      />
                    </ReferenceLinkCard>
                    <Box>{menu}</Box>
                  </TooltipDelayGroupProvider>
                </Flex>
                {footer}
              </Stack>
            </Card>
          )}
        </FormField>
      </FieldActionsProvider>
    </>
  )
}
