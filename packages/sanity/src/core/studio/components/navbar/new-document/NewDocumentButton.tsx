import {AddIcon, SearchIcon} from '@sanity/icons'
import {isDeprecatedSchemaType} from '@sanity/types'
import {
  Card,
  Flex,
  Stack,
  Text,
  TextInput,
  type TextInputProps,
  useClickOutsideEvent,
} from '@sanity/ui'
import {type ChangeEvent, type KeyboardEvent, useCallback, useMemo, useRef, useState} from 'react'
import ReactFocusLock from 'react-focus-lock'

import {Button, type ButtonProps, Tooltip, type TooltipProps} from '../../../../../ui-components'
import {InsufficientPermissionsMessage} from '../../../../components'
import {useSchema} from '../../../../hooks'
import {useGetI18nText, useTranslation} from '../../../../i18n'
import {usePerspective} from '../../../../perspective/usePerspective'
import {useIsReleaseActive} from '../../../../releases/hooks/useIsReleaseActive'
import {isPublishedPerspective} from '../../../../releases/util/util'
import {useCurrentUser} from '../../../../store'
import {useColorSchemeValue} from '../../../colorScheme'
import {filterOptions} from './filter'
import {
  DialogHeaderCard,
  PopoverHeaderCard,
  PopoverListFlex,
  RootFlex,
  StyledDialog,
  StyledPopover,
} from './NewDocumentButton.style'
import {NewDocumentList, type NewDocumentListProps} from './NewDocumentList'
import {INLINE_PREVIEW_HEIGHT} from './NewDocumentListOption'
import {type ModalType, type NewDocumentOption} from './types'

const MAX_DISPLAYED_ITEMS = 10

interface NewDocumentButtonProps {
  canCreateDocument: boolean
  loading: boolean
  modal?: ModalType
  options: NewDocumentOption[]
}

/**
 * @internal
 */
export function NewDocumentButton(props: NewDocumentButtonProps) {
  const {canCreateDocument, modal = 'popover', loading, options} = props

  const isReleaseActive = useIsReleaseActive()
  const {selectedPerspective} = usePerspective()
  const [open, setOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const [searchInputElement, setSearchInputElement] = useState<HTMLInputElement | null>(null)
  const {t} = useTranslation()
  const getI18nText = useGetI18nText(options)

  const scheme = useColorSchemeValue()
  const currentUser = useCurrentUser()
  const schema = useSchema()

  const hasNewDocumentOptions = options.length > 0
  const disabled = !canCreateDocument || !hasNewDocumentOptions || !isReleaseActive
  const placeholder = t('new-document.filter-placeholder')
  const title = t('new-document.title')
  const openDialogAriaLabel = t('new-document.open-dialog-aria-label')

  const validOptions = useMemo(
    () =>
      options.filter((option) => {
        const optionSchema = schema.get(option.schemaType)
        return optionSchema && !isDeprecatedSchemaType(optionSchema)
      }),
    [options, schema],
  )

  // Filter options based on search query
  const filteredOptions = useMemo(
    () => filterOptions(validOptions, searchQuery, getI18nText),
    [validOptions, searchQuery, getI18nText],
  )

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.currentTarget.value)
  }, [])

  const handleToggleOpen = useCallback(() => setOpen((v) => !v), [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setSearchQuery('')
    buttonElement?.focus()
  }, [buttonElement])

  // Open popover on arrow down
  const handleOpenButtonKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'ArrowDown' && !open) {
        setOpen(true)
      }
    },
    [open],
  )

  // Close popover on escape or tab
  const handlePopoverKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if ((e.key === 'Escape' || e.key === 'Tab') && open) {
        handleClose()
      }
    },
    [handleClose, open],
  )

  // Close popover on click outside
  useClickOutsideEvent(open && handleClose, () => [
    buttonElement,
    dialogRef.current,
    popoverRef.current,
  ])

  const sharedListProps: NewDocumentListProps = useMemo(
    () => ({
      currentUser,
      loading: loading,
      onDocumentClick: handleToggleOpen,
      options: filteredOptions,
      searchQuery: searchQuery,
      preview: modal === 'popover' ? 'inline' : 'default',
      textInputElement: searchInputElement,
    }),
    [
      currentUser,
      filteredOptions,
      handleToggleOpen,
      loading,
      modal,
      searchInputElement,
      searchQuery,
    ],
  )

  // Shared text input props for the popover and dialog
  const sharedTextInputProps: TextInputProps = useMemo(
    () => ({
      '__unstable_disableFocusRing': true,
      'border': false,
      'data-testid': 'new-document-button-search-input',
      'defaultValue': searchQuery,
      'disabled': loading,
      'icon': SearchIcon,
      'onChange': handleSearchChange,
      'placeholder': placeholder,
      'ref': setSearchInputElement,
    }),
    [handleSearchChange, loading, placeholder, searchQuery],
  )

  // Shared open button props for the popover and dialog
  const sharedOpenButtonProps: ButtonProps = useMemo(
    () => ({
      'aria-label': openDialogAriaLabel,
      'data-testid': 'new-document-button',
      'disabled': disabled || loading,
      'icon': AddIcon,
      'text': '',
      'mode': 'bleed',
      'onClick': handleToggleOpen,
      'ref': setButtonElement,
      'selected': open,
    }),
    [disabled, handleToggleOpen, loading, open, openDialogAriaLabel],
  )

  // Tooltip content for the open button
  const tooltipContent: TooltipProps['content'] = useMemo(() => {
    if (!isReleaseActive) {
      const tooltipText = isPublishedPerspective(selectedPerspective)
        ? t('new-document.disabled-published.tooltip')
        : t('new-document.disabled-release.tooltip')

      return <Text size={1}>{tooltipText}</Text>
    }
    if (!hasNewDocumentOptions) {
      return <Text size={1}>{t('new-document.no-document-types-label')}</Text>
    }

    if (canCreateDocument) {
      return <Text size={1}>{t('new-document.create-new-document-label')}</Text>
    }

    return (
      <InsufficientPermissionsMessage currentUser={currentUser} context="create-any-document" />
    )
  }, [
    canCreateDocument,
    currentUser,
    hasNewDocumentOptions,
    isReleaseActive,
    selectedPerspective,
    t,
  ])

  // Shared tooltip props for the popover and dialog
  const sharedTooltipProps: TooltipProps = useMemo(
    () => ({
      content: tooltipContent,
      disabled: loading || open,
      scheme: scheme,
    }),
    [loading, open, scheme, tooltipContent],
  )

  // Dialog
  if (modal === 'dialog') {
    return (
      <>
        <Tooltip {...sharedTooltipProps}>
          <div>
            <Button {...sharedOpenButtonProps} />
          </div>
        </Tooltip>

        {open && (
          <StyledDialog
            header={title}
            id="create-new-document-dialog"
            onClickOutside={handleClose}
            onClose={handleClose}
            ref={dialogRef}
            scheme={scheme}
            width={1}
          >
            <RootFlex direction="column" flex={1} height="fill">
              <DialogHeaderCard padding={2} borderBottom>
                <TextInput
                  data-testid="new-document-button-search-input"
                  {...sharedTextInputProps}
                />
              </DialogHeaderCard>

              <Flex direction="column" overflow="hidden">
                <NewDocumentList {...sharedListProps} />
              </Flex>
            </RootFlex>
          </StyledDialog>
        )}
      </>
    )
  }

  // Popover
  return (
    <StyledPopover
      constrainSize
      onKeyDown={handlePopoverKeyDown}
      open={open}
      tone="default"
      portal
      radius={3}
      ref={popoverRef}
      scheme={scheme}
      content={
        <RootFlex
          direction="column"
          flex={1}
          forwardedAs={ReactFocusLock}
          height="fill"
          returnFocus
        >
          <PopoverHeaderCard sizing="border">
            <Stack>
              <Card borderBottom padding={1}>
                <TextInput {...sharedTextInputProps} fontSize={1} radius={1} />
              </Card>
            </Stack>
          </PopoverHeaderCard>

          <PopoverListFlex
            $itemHeight={INLINE_PREVIEW_HEIGHT}
            $maxDisplayedItems={MAX_DISPLAYED_ITEMS}
            direction="column"
            overflow="hidden"
          >
            <NewDocumentList {...sharedListProps} />
          </PopoverListFlex>
        </RootFlex>
      }
    >
      <div>
        <Tooltip {...sharedTooltipProps}>
          <div>
            <Button
              {...sharedOpenButtonProps}
              aria-expanded={open}
              aria-haspopup="true"
              onKeyDown={handleOpenButtonKeyDown}
            />
          </div>
        </Tooltip>
      </div>
    </StyledPopover>
  )
}
