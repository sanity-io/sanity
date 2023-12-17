import React, {useRef, useCallback, useMemo} from 'react'
import {Box, Inline, Text, useGlobalKeyDown, useTheme} from '@sanity/ui'
import {EditIcon, TrashIcon} from '@sanity/icons'
import {useTranslation} from '../../../../i18n'
import {Button, Popover, PopoverProps} from '../../../../ui-components'

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
  const {t} = useTranslation()
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
            <Text weight="medium" size={1}>
              {title}
            </Text>
          </Box>
          <Button
            icon={EditIcon}
            mode="bleed"
            onClick={onEdit}
            ref={editButtonRef}
            tooltipProps={{content: t('inputs.portable-text.inline-object.edit')}}
          />
          <Button
            ref={deleteButtonRef}
            icon={TrashIcon}
            mode="bleed"
            onClick={handleDelete}
            tone="critical"
            tooltipProps={{content: t('inputs.portable-text.inline-object.remove')}}
          />
        </Inline>
      </Box>
    ),
    [handleDelete, onEdit, title, t],
  )

  return (
    <Popover
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
