import {PortableTextEditor, usePortableTextEditor} from '@portabletext/editor'
import {EditIcon, TrashIcon} from '@sanity/icons'
import {Box, Flex, Text, useGlobalKeyDown, useTheme} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useRef, useState} from 'react'

import {Button, Popover, type PopoverProps} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

interface InlineObjectToolbarPopoverProps {
  floatingBoundary: HTMLElement | null
  inlineObjectFocused: boolean
  inlineObjectOpen: boolean
  onOpenInlineObject: () => void
  onRemoveInlineObject: () => void
  referenceBoundary: HTMLElement | null
  referenceElement: HTMLElement | null
  title: string
}

export function InlineObjectToolbarPopover(props: InlineObjectToolbarPopoverProps): ReactNode {
  const {
    floatingBoundary,
    inlineObjectFocused,
    inlineObjectOpen,
    onOpenInlineObject,
    onRemoveInlineObject,
    referenceBoundary,
    referenceElement,
    title,
  } = props
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false)
  const {sanity} = useTheme()
  const {t} = useTranslation()
  const editButtonRef = useRef<HTMLButtonElement | null>(null)
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null)
  const focusTrappedRef = useRef<HTMLButtonElement | null>(null)
  const popoverScheme = sanity.color.dark ? 'light' : 'dark'
  const editor = usePortableTextEditor()
  const contentRef = useRef<HTMLDivElement | null>(null)

  const handleClosePopover = useCallback(() => {
    setPopoverOpen(false)
    PortableTextEditor.focus(editor)
    focusTrappedRef.current = null
  }, [editor])

  // Tab to edit button on tab
  // Close floating toolbar on Escape
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (!popoverOpen) {
          return
        }
        if (event.key === 'Tab') {
          if (
            inlineObjectFocused &&
            event.target instanceof HTMLElement &&
            event.target.contentEditable &&
            focusTrappedRef.current === null
          ) {
            event.preventDefault()
            editButtonRef.current?.focus()
            focusTrappedRef.current = editButtonRef.current
            return
          }
          if (event.target === deleteButtonRef.current) {
            event.preventDefault()
            event.stopPropagation()
            focusTrappedRef.current = null
            PortableTextEditor.focus(editor)
            return
          }
        }
        if (event.key === 'Escape') {
          handleClosePopover()
        }
      },
      [editor, inlineObjectFocused, handleClosePopover, popoverOpen],
    ),
  )

  useEffect(() => {
    focusTrappedRef.current = null
    if (inlineObjectOpen) {
      setPopoverOpen(false)
      return
    }
    if (inlineObjectFocused) {
      setPopoverOpen(true)
      return
    }
    setPopoverOpen(false)
  }, [inlineObjectFocused, inlineObjectOpen])

  const handleEditButtonClicked = useCallback(() => {
    setPopoverOpen(false)
    onOpenInlineObject()
  }, [onOpenInlineObject])

  const handleRemoveButtonClicked = useCallback(() => {
    setPopoverOpen(false)
    onRemoveInlineObject()
  }, [onRemoveInlineObject])

  return (
    <Popover
      open={!inlineObjectOpen && popoverOpen}
      floatingBoundary={floatingBoundary}
      constrainSize
      content={
        <Box padding={1} data-testid="inline-object-toolbar-popover" ref={contentRef}>
          <Flex gap={1}>
            <Box padding={2}>
              <Text weight="medium" size={1}>
                {title}
              </Text>
            </Box>
            <Button
              aria-label={t('inputs.portable-text.inline-object.edit-aria-label')}
              data-testid="edit-inline-object-button"
              icon={EditIcon}
              mode="bleed"
              onClick={handleEditButtonClicked}
              ref={editButtonRef}
              tabIndex={0}
              tooltipProps={{content: t('inputs.portable-text.inline-object.edit')}}
            />
            <Button
              aria-label={t('inputs.portable-text.inline-object.remove-aria-label')}
              data-testid="remove-inline-object-button"
              icon={TrashIcon}
              mode="bleed"
              onClick={handleRemoveButtonClicked}
              ref={deleteButtonRef}
              tabIndex={0}
              tone="critical"
              tooltipProps={{content: t('inputs.portable-text.inline-object.remove')}}
            />
          </Flex>
        </Box>
      }
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      placement="top"
      portal
      preventOverflow
      referenceBoundary={referenceBoundary}
      referenceElement={referenceElement}
      scheme={popoverScheme}
    />
  )
}
