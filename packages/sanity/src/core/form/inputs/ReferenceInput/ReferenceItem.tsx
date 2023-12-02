import {Box, CardTone, Menu, MenuButton, MenuDivider} from '@sanity/ui'
import React, {ComponentProps, ForwardedRef, forwardRef, useCallback, useMemo, useRef} from 'react'
import {
  CloseIcon,
  CopyIcon as DuplicateIcon,
  EllipsisHorizontalIcon,
  LaunchIcon as OpenInNewTabIcon,
  SyncIcon as ReplaceIcon,
  TrashIcon,
} from '@sanity/icons'
import type {Reference, ReferenceSchemaType, SchemaType} from '@sanity/types'
import {LoadingBlock} from '../../../../ui/loadingBlock'
import type {ObjectItem, ObjectItemProps} from '../../types'
import {useScrollIntoViewOnFocusWithin} from '../../hooks/useScrollIntoViewOnFocusWithin'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {randomKey} from '../../utils/randomKey'
import {FormFieldSet, FormFieldValidationStatus} from '../../components/formField'
import {FieldPresence} from '../../../presence'
import {Button, MenuItem} from '../../../../ui'
import {useTranslation} from '../../../i18n'
import {ChangeIndicator} from '../../../changeIndicators'
import {RowLayout} from '../arrays/layouts/RowLayout'
import {set, unset} from '../../patch'
import {createProtoArrayValue} from '../arrays/ArrayOfObjectsInput/createProtoArrayValue'
import {InsertMenu} from '../arrays/ArrayOfObjectsInput/InsertMenu'
import {useReferenceInfo} from './useReferenceInfo'
import {PreviewReferenceValue} from './PreviewReferenceValue'
import {useReferenceInput} from './useReferenceInput'
import {ReferenceLinkCard} from './ReferenceLinkCard'
import {ReferenceItemRefProvider} from './ReferenceItemRefProvider'
import {ReferenceFinalizeAlertStrip} from './ReferenceFinalizeAlertStrip'
import {ReferenceStrengthMismatchAlertStrip} from './ReferenceStrengthMismatchAlertStrip'
import {ReferenceMetadataLoadErrorAlertStrip} from './ReferenceMetadataLoadFailure'
import {IntentLink} from 'sanity/router'

export interface ReferenceItemValue extends Omit<ObjectItem, '_type'>, Omit<Reference, '_key'> {}

interface ReferenceItemProps<Item extends ReferenceItemValue>
  extends Omit<ObjectItemProps<ReferenceItemValue>, 'renderDefault'> {
  value: Item
  schemaType: ReferenceSchemaType
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

export function ReferenceItem<Item extends ReferenceItemValue = ReferenceItemValue>(
  props: ReferenceItemProps<Item>,
) {
  const {
    schemaType,
    parentSchemaType,
    path,
    readOnly,
    onRemove,
    value,
    open,
    onInsert,
    presence,
    validation,
    inputId,
    changed,
    focused,
    children,
    inputProps: {onChange, focusPath, onPathFocus, renderPreview, elementProps},
  } = props

  const sortable = !readOnly && parentSchemaType.options?.sortable !== false
  const insertableTypes = parentSchemaType.of

  const elementRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

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
    [onInsert],
  )
  const loadableReferenceInfo = useReferenceInfo(value?._ref, getReferenceInfo)

  const hasRef = value._ref
  const refTypeName = loadableReferenceInfo.result?.type || value?._strengthenOnPublish?.type
  const publishedReferenceExists = hasRef && loadableReferenceInfo.result?.preview?.published?._id

  const handleRemoveStrengthenOnPublish = useCallback(() => {
    onChange([
      schemaType.weak === true ? set(true, ['_weak']) : unset(['_weak']),
      unset(['_strengthenOnPublish']),
    ])
  }, [onChange, schemaType.weak])

  const refType = refTypeName
    ? schemaType.to.find((toType) => toType.name === refTypeName)
    : undefined
  const pressed = selectedState === 'pressed'
  const selected = selectedState === 'selected'

  const tone = getTone({readOnly, hasErrors, hasWarnings})
  const isEditing = !hasRef || focusPath[0] === '_ref'

  const {t} = useTranslation()

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

  const handleReplace = useCallback(() => {
    if (hasRef && isEditing) {
      onPathFocus([])
    } else {
      onPathFocus(['_ref'])
    }
  }, [hasRef, isEditing, onPathFocus])

  const menu = useMemo(
    () =>
      readOnly ? null : (
        <Box marginLeft={1}>
          <MenuButton
            button={
              <Button
                mode="bleed"
                icon={EllipsisHorizontalIcon}
                tooltipProps={{content: 'Show more'}}
              />
            }
            id={`${inputId}-menuButton`}
            menu={
              <Menu ref={menuRef}>
                {!readOnly && (
                  <>
                    <MenuItem
                      text={t('inputs.reference.action.remove')}
                      tone="critical"
                      icon={TrashIcon}
                      onClick={onRemove}
                    />
                    <MenuItem
                      text={t(
                        hasRef && isEditing
                          ? 'inputs.reference.action.replace-cancel'
                          : 'inputs.reference.action.replace',
                      )}
                      icon={hasRef && isEditing ? CloseIcon : ReplaceIcon}
                      onClick={handleReplace}
                    />
                    <MenuItem
                      text={t('inputs.reference.action.duplicate')}
                      icon={DuplicateIcon}
                      onClick={handleDuplicate}
                    />
                    <InsertMenu onInsert={handleInsert} types={insertableTypes} />
                  </>
                )}

                {!readOnly && !isEditing && hasRef && <MenuDivider />}
                {!isEditing && hasRef && (
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
    [
      handleDuplicate,
      handleInsert,
      handleReplace,
      hasRef,
      inputId,
      insertableTypes,
      isEditing,
      onRemove,
      OpenLink,
      readOnly,
      t,
    ],
  )

  const handleFixStrengthMismatch = useCallback(() => {
    onChange(schemaType.weak === true ? set(true, ['_weak']) : unset(['_weak']))
  }, [onChange, schemaType])

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

  const issues = (
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

  const item = (
    <ReferenceItemRefProvider menuRef={menuRef} containerRef={containerRef}>
      <RowLayout
        dragHandle={sortable}
        presence={
          !isEditing && presence.length > 0 && <FieldPresence presence={presence} maxAvatars={1} />
        }
        validation={
          !isEditing &&
          validation.length > 0 && <FormFieldValidationStatus validation={validation} />
        }
        menu={menu}
        footer={isEditing ? undefined : issues}
        tone={isEditing ? undefined : tone}
        focused={focused}
      >
        {isEditing ? (
          <Box padding={1} ref={containerRef}>
            <FormFieldSet
              title={schemaType.title}
              description={schemaType.description}
              __unstable_presence={presence}
              validation={validation}
              inputId={inputId}
            >
              {children}
            </FormFieldSet>
          </Box>
        ) : (
          <ReferenceLinkCard
            as={EditReferenceLink}
            tone="inherit"
            radius={2}
            documentId={value?._ref}
            documentType={refType?.name}
            disabled={resolvingInitialValue}
            __unstable_focusRing
            selected={selected}
            pressed={pressed}
            data-selected={selected ? true : undefined}
            data-pressed={pressed ? true : undefined}
            {...elementProps}
          >
            <PreviewReferenceValue
              layout="compact"
              value={value}
              referenceInfo={loadableReferenceInfo}
              renderPreview={renderPreview}
              type={schemaType}
            />
            {resolvingInitialValue && <LoadingBlock fill hideText />}
          </ReferenceLinkCard>
        )}
      </RowLayout>
    </ReferenceItemRefProvider>
  )
  return (
    <ChangeIndicator path={path} isChanged={changed} hasFocus={Boolean(focused)}>
      <Box paddingX={1}>{item}</Box>
    </ChangeIndicator>
  )
}
