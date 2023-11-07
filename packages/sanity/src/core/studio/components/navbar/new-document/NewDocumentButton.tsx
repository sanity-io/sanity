import React, {useCallback, useMemo, useState} from 'react'
import {
  Box,
  Tooltip,
  Text,
  useClickOutside,
  Stack,
  TextInput,
  ButtonProps,
  TooltipProps,
  TextInputProps,
  Label,
  Card,
  Flex,
  Button,
} from '@sanity/ui'
import {ComposeIcon, SearchIcon} from '@sanity/icons'
import ReactFocusLock from 'react-focus-lock'
import {useTranslation} from '../../../../i18n'
import {InsufficientPermissionsMessage} from '../../../../components'
import {useCurrentUser} from '../../../../store'
import {useColorScheme} from '../../../colorScheme'
import {NewDocumentList, NewDocumentListProps} from './NewDocumentList'
import {ModalType, NewDocumentOption} from './types'
import {filterOptions} from './filter'
import {
  DialogHeaderCard,
  PopoverHeaderCard,
  RootFlex,
  StyledDialog,
  StyledPopover,
  TooltipContentBox,
  PopoverListFlex,
} from './NewDocumentButton.style'
import {INLINE_PREVIEW_HEIGHT} from './NewDocumentListOption'

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

  const [open, setOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const [dialogElement, setDialogElement] = useState<HTMLDivElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)
  const [searchInputElement, setSearchInputElement] = useState<HTMLInputElement | null>(null)
  const {t} = useTranslation()

  const {scheme} = useColorScheme()
  const currentUser = useCurrentUser()

  const hasNewDocumentOptions = options.length > 0
  const disabled = !canCreateDocument || !hasNewDocumentOptions
  const placeholder = t('new-document.filter-placeholder')
  const title = t('new-document.title')
  const openDialogAriaLabel = t('new-document.open-dialog-aria-label')

  // Filter options based on search query
  const filteredOptions = useMemo(() => filterOptions(options, searchQuery), [options, searchQuery])

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'ArrowDown' && !open) {
        setOpen(true)
      }
    },
    [open],
  )

  // Close popover on escape or tab
  const handlePopoverKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if ((e.key === 'Escape' || e.key === 'Tab') && open) {
        handleClose()
      }
    },
    [handleClose, open],
  )

  // Close popover on click outside
  useClickOutside(() => {
    if (open) {
      handleClose()
    }
  }, [buttonElement, dialogElement, popoverElement])

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
      border: false,
      defaultValue: searchQuery,
      disabled: loading,
      icon: SearchIcon,
      onChange: handleSearchChange,
      placeholder: placeholder,
      ref: setSearchInputElement,
    }),
    [handleSearchChange, loading, placeholder, searchQuery],
  )

  // Shared open button props for the popover and dialog
  const sharedOpenButtonProps: ButtonProps = useMemo(
    () => ({
      'aria-label': openDialogAriaLabel,
      disabled: disabled || loading,
      icon: ComposeIcon,
      mode: 'bleed',
      onClick: handleToggleOpen,
      ref: setButtonElement,
      selected: open,
    }),
    [disabled, handleToggleOpen, loading, open, openDialogAriaLabel],
  )

  // Tooltip content for the open button
  const tooltipContent: TooltipProps['content'] = useMemo(() => {
    if (!hasNewDocumentOptions) {
      return <Text size={1}>{t('new-document.no-document-types-label')}</Text>
    }

    if (canCreateDocument) {
      return <Text size={1}>{t('new-document.create-new-document-label')}</Text>
    }

    return (
      <InsufficientPermissionsMessage
        currentUser={currentUser}
        operationLabel={t('insufficient-permissions-message.operation-label.create-any-document')}
      />
    )
  }, [canCreateDocument, currentUser, hasNewDocumentOptions, t])

  // Shared tooltip props for the popover and dialog
  const sharedTooltipProps: TooltipProps = useMemo(
    () => ({
      content: <TooltipContentBox padding={2}>{tooltipContent}</TooltipContentBox>,
      disabled: loading || open,
      placement: 'bottom',
      portal: true,
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
            ref={setDialogElement}
            scheme={scheme}
            width={1}
          >
            <RootFlex direction="column" flex={1} height="fill">
              <DialogHeaderCard padding={2} borderBottom>
                <TextInput {...sharedTextInputProps} />
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
      portal
      radius={3}
      ref={setPopoverElement}
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
              <Box paddingX={3} paddingY={3}>
                <Box paddingY={1}>
                  <Label size={1} muted>
                    {title}
                  </Label>
                </Box>
              </Box>
              <Card borderTop borderBottom padding={1}>
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
