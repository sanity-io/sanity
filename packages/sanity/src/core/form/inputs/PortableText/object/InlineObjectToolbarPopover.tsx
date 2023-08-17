import React, {useRef, useCallback, useMemo} from 'react'
import {
  Box,
  Button,
  Inline,
  Popover,
  PopoverProps,
  Text,
  useGlobalKeyDown,
  useTheme,
} from '@sanity/ui'
import styled from 'styled-components'
import {EditIcon, TrashIcon} from '@sanity/icons'

const ToolbarPopover = styled(Popover)`
  &[data-popper-reference-hidden='true'] {
    display: none !important;
  }
`

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom']

interface InlineObjectToolbarPopoverProps {
  floatingBoundary: HTMLElement | null
  open: boolean
  onClosePopover: () => void
  onDelete: (event: React.MouseEvent<HTMLButtonElement>) => void
  onEdit: (event: React.MouseEvent<HTMLButtonElement>) => void
  referenceBoundary: HTMLElement | null
  referenceElement: HTMLElement | null
  title: string
}

export function InlineObjectToolbarPopover(props: InlineObjectToolbarPopoverProps) {
  const {
    floatingBoundary,
    onClosePopover,
    onEdit,
    onDelete,
    referenceBoundary,
    referenceElement,
    title,
    open,
  } = props
  const {sanity} = useTheme()
  const editButtonRef = useRef<HTMLButtonElement | null>(null)
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null)
  const popoverScheme = sanity.color.dark ? 'light' : 'dark'

  // Close floating toolbar on Escape
  // Focus to edit button on Tab
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          onClosePopover()
        }
      },
      [onClosePopover],
    ),
  )

  const handleDelete = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (deleteButtonRef.current?.disabled) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      try {
        onDelete(event)
      } catch (err) {
        console.error(err)
      } finally {
        if (deleteButtonRef.current) {
          deleteButtonRef.current.disabled = true
        }
      }
    },
    [onDelete],
  )

  const popoverContent = useMemo(
    () => (
      <Box padding={1}>
        <Inline space={1}>
          <Box padding={2}>
            <Text weight="semibold" size={1}>
              {title}
            </Text>
          </Box>
          <Button
            icon={EditIcon}
            mode="bleed"
            onClick={onEdit}
            padding={2}
            ref={editButtonRef}
            alt="Edit object"
          />
          <Button
            ref={deleteButtonRef}
            icon={TrashIcon}
            mode="bleed"
            padding={2}
            onClick={handleDelete}
            tone="critical"
            alt="Remove object"
          />
        </Inline>
      </Box>
    ),
    [handleDelete, onEdit, title],
  )

  return (
    <ToolbarPopover
      constrainSize
      content={popoverContent}
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      floatingBoundary={floatingBoundary}
      open={open}
      placement="top"
      portal
      referenceBoundary={referenceBoundary}
      referenceElement={referenceElement}
      scheme={popoverScheme}
    />
  )
}
