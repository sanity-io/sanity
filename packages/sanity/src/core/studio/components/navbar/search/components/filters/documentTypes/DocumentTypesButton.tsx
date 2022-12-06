import {SelectIcon} from '@sanity/icons'
import {Button, Popover, Theme, useClickOutside} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import styled, {css} from 'styled-components'
import {POPOVER_RADIUS, POPOVER_VERTICAL_MARGIN} from '../../../constants'
import {useSearchState} from '../../../contexts/search/useSearchState'
import {documentTypesTruncated} from '../../../utils/documentTypesTruncated'
import {FilterPopoverWrapper} from '../common/FilterPopoverWrapper'
import {DocumentTypesPopoverContent} from './DocumentTypesPopoverContent'

const StyledButton = styled(Button)(({theme}: {theme: Theme}) => {
  const {regular} = theme.sanity.fonts.text.weights

  return css`
    [data-ui='Text'] {
      font-weight: ${regular};
    }
  `
})

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
      portal
      radius={POPOVER_RADIUS}
      ref={setPopoverElement}
    >
      <StyledButton
        fontSize={1}
        iconRight={SelectIcon}
        mode="ghost"
        onClick={handleOpen}
        padding={fullscreen ? 3 : 2}
        ref={setButtonElement}
        style={{maxWidth: '100%'}}
        text={title}
        tone="default"
      />
    </Popover>
  )
}
