import {SelectIcon} from '@sanity/icons'
import {Placement, Popover, useClickOutside} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {POPOVER_RADIUS, POPOVER_VERTICAL_MARGIN} from '../../../constants'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {documentTypesTruncated} from '../../../utils/documentTypesTruncated'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {Button} from '../../../../../../../../ui'
import {DocumentTypesPopoverContent} from './DocumentTypesPopoverContent'

const FALLBACK_PLACEMENTS: Placement[] = ['top-start', 'bottom-start']

export function DocumentTypesButton() {
  const [open, setOpen] = useState(false)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLElement | null>(null)

  const {
    state: {
      fullscreen,
      terms: {types},
    },
  } = useSearchState()

  const handleClose = useCallback(() => setOpen(false), [])
  const handleOpen = useCallback(() => setOpen(true), [])

  useClickOutside(handleClose, [buttonElement, popoverElement])

  const title = useMemo(() => documentTypesTruncated({types}), [types])

  return (
    <Popover
      __unstable_margins={[POPOVER_VERTICAL_MARGIN, 0, 0, 0]}
      content={
        <FilterPopoverWrapper anchorElement={buttonElement} onClose={handleClose}>
          <DocumentTypesPopoverContent />
        </FilterPopoverWrapper>
      }
      open={open}
      placement="bottom-start"
      fallbackPlacements={FALLBACK_PLACEMENTS}
      portal
      radius={POPOVER_RADIUS}
      ref={setPopoverElement}
    >
      <Button
        iconRight={SelectIcon}
        mode="ghost"
        onClick={handleOpen}
        size={fullscreen ? 'default' : 'small'}
        ref={setButtonElement}
        selected={open}
        text={title}
        tone="default"
      />
    </Popover>
  )
}
