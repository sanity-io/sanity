import {Card, Flex, studioTheme, Theme, useClickOutside} from '@sanity/ui'
import React, {RefObject, useCallback, useEffect, useState} from 'react'
import styled, {css} from 'styled-components'
import {DialogContent} from './DialogContent'
import {DialogHeader} from './DialogHeader'
import {TypeFilter} from './TypeFilter'

export interface OmnisearchPopoverProps {
  onClose: () => void
  placeholderRef: RefObject<HTMLInputElement>
}

const DIALOG_MAX_WIDTH = 800 // px
const DIALOG_SEARCH_FIELD_PADDING = 1 // Sanity UI scale

const searchFieldPaddingPx = studioTheme.space[DIALOG_SEARCH_FIELD_PADDING]

export function Dialog({onClose, placeholderRef}: OmnisearchPopoverProps) {
  const [dialogPosition, setDialogPosition] = useState(calcDialogPosition(placeholderRef))
  const [dialogEl, setDialogEl] = useState<HTMLDivElement>()

  useClickOutside(onClose, [dialogEl])

  const handleWindowResize = useCallback(() => {
    setDialogPosition(calcDialogPosition(placeholderRef))
  }, [placeholderRef])

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [handleWindowResize])

  return (
    <>
      <Overlay />
      <DialogCard
        data-ui="omnisearch-dialog"
        overflow="hidden"
        radius={2}
        ref={setDialogEl}
        scheme="light"
        shadow={2}
        x={dialogPosition.x}
        y={dialogPosition.y}
      >
        <DialogHeader />

        <Flex align="stretch">
          <DialogContent />
          <TypeFilter />
        </Flex>
      </DialogCard>
    </>
  )
}

function calcDialogPosition(
  ref: RefObject<HTMLInputElement>
): {
  x: number | null
  y: number
} {
  const placeholderRect = ref.current.getBoundingClientRect()

  // Offset positioning to account for dialog padding. This should ensure that our dialog search input
  // sits directly over the top of the placeholder.
  return {
    x:
      window.innerWidth - placeholderRect.x > DIALOG_MAX_WIDTH
        ? placeholderRect.x - searchFieldPaddingPx
        : null,
    y: placeholderRect.y - searchFieldPaddingPx,
  }
}

const DialogCard = styled(Card)<{x: number | null; y: number}>`
  ${(props) =>
    props.x
      ? css`
          left: ${props.x}px;
        `
      : css`
          left: 50%;
          transform: translateX(-50%);
        `}
  display: flex !important;
  flex-direction: column;
  max-height: min(calc(100vh - ${searchFieldPaddingPx * 2}px), 700px);
  position: absolute;
  top: ${(props) => props.y}px;
  width: min(calc(100vw - ${searchFieldPaddingPx * 2}px), ${DIALOG_MAX_WIDTH}px);
  z-index: 1000; /* TODO: don't hardcode */
`

const Overlay = styled.div`
  background-color: ${({theme}: {theme: Theme}) => theme.sanity.color.base.shadow.ambient};
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 999; /* TODO: don't hardcode */
`
