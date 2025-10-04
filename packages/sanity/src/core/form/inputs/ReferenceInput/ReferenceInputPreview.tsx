import {LaunchIcon as OpenInNewTabIcon, SyncIcon as ReplaceIcon, TrashIcon} from '@sanity/icons'
import {type Reference} from '@sanity/types'
import {Box, Card, Flex, Menu, MenuDivider, Stack} from '@sanity/ui'
import {type CardTone} from '@sanity/ui/theme'
import {type FocusEvent, useCallback, useRef} from 'react'
import {IntentLink} from 'sanity/router'

import {MenuButton, MenuItem, TooltipDelayGroupProvider} from '../../../../ui-components'
import {ContextMenuButton} from '../../../components/contextMenuButton'
import {useTranslation} from '../../../i18n'
import {usePerspective} from '../../../perspective/usePerspective'
import {EMPTY_ARRAY} from '../../../util/empty'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {set, unset} from '../../patch'
import {PreviewReferenceValue} from './PreviewReferenceValue'
import {ReferenceFinalizeAlertStrip} from './ReferenceFinalizeAlertStrip'
import {ReferenceLinkCard} from './ReferenceLinkCard'
import {ReferenceMetadataLoadErrorAlertStrip} from './ReferenceMetadataLoadFailure'
import {ReferenceStrengthMismatchAlertStrip} from './ReferenceStrengthMismatchAlertStrip'
import {type ReferenceInfo, type ReferenceInputProps} from './types'
import {type Loadable, useReferenceInfo} from './useReferenceInfo'
import {useReferenceInput} from './useReferenceInput'

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
    return 'neutral'
  }
  if (hasErrors) {
    return 'critical'
  }
  return hasWarnings ? 'caution' : 'default'
}
const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const

// eslint-disable-next-line complexity
export function ReferenceInputPreview(props: ReferenceInputProps & {children: React.ReactNode}) {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const {schemaType, path, children, focusPath} = props
  const {readOnly, focused, renderPreview, onChange, onPathFocus, id: inputId} = props
  const {selectedReleaseId} = usePerspective()

  const handleClear = useCallback(() => onChange(unset()), [onChange])
  const value: Reference | undefined = props.value as any

  const {EditReferenceLink, getReferenceInfo, selectedState, isCurrentDocumentLiveEdit} =
    useReferenceInput({
      path,
      schemaType,
      value,
      version: selectedReleaseId,
    })

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus && elementRef.current) {
      // Note: if editing an inline item, focus is handled by the item input itself and no ref is being set
      elementRef.current.focus()
    }
  })

  const hasErrors = props.validation.some((v) => v.level === 'error')
  const hasWarnings = props.validation.some((v) => v.level === 'warning')

  const loadableReferenceInfo: Loadable<ReferenceInfo> = useReferenceInfo(
    value?._ref,
    getReferenceInfo,
  )

  const refTypeName = loadableReferenceInfo.result?.type || value?._strengthenOnPublish?.type

  const refType = refTypeName
    ? schemaType.to.find((toType) => toType.name === refTypeName)
    : undefined
  const pressed = selectedState === 'pressed'
  const selected = selectedState === 'selected'

  const hasRef = value?._ref
  const publishedReferenceExists = hasRef && loadableReferenceInfo.result?.isPublished

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
    onPathFocus(['_ref'])
  }, [onPathFocus])

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
  const isEditing = !value?._ref || focusPath[0] === '_ref'

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

  const menu = readOnly ? null : (
    <Box flex="none">
      <MenuButton
        button={<ContextMenuButton />}
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
                as={IntentLink}
                icon={OpenInNewTabIcon}
                intent="edit"
                params={{id: value?._ref, type: refType?.name}}
                rel="noopener noreferrer"
                target="_blank"
                text={t('inputs.reference.action.open-in-new-tab')}
              />
            )}
          </Menu>
        }
        popover={MENU_POPOVER_PROPS}
      />
    </Box>
  )

  const handleFocus = useCallback(
    (event: FocusEvent) => {
      if (event.target === elementRef.current) {
        onPathFocus(EMPTY_ARRAY)
      }
    },
    [onPathFocus],
  )

  if (isEditing) {
    return <Box>{children}</Box>
  }

  return (
    <Card border radius={2} padding={1} tone={tone}>
      <Stack gap={1}>
        <Flex gap={1} align="center" style={{lineHeight: 0}}>
          <TooltipDelayGroupProvider>
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
              onFocus={handleFocus}
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
  )
}
