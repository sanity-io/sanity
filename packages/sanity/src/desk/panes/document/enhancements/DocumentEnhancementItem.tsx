import {useClickOutside, ButtonProps, Dialog, Popover, MenuItem, Button} from '@sanity/ui'
import React, {createElement, useCallback, useEffect, useMemo, useState} from 'react'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../constants'
import {DocumentEnhancement} from 'sanity'

interface DocumentEnhancementItemProps {
  enhancement: DocumentEnhancement
  documentId: string
  documentType: string
  onClick?: (enhancement: DocumentEnhancement | null) => void
}

export function DocumentEnhancementItem(props: DocumentEnhancementItemProps) {
  const {documentId, documentType, enhancement, onClick} = props
  const isMenuContext = enhancement.context === 'menu'
  const [open, setOpen] = useState<boolean>(false)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLElement | null>(null)

  const handleToggleOpen = useCallback(() => setOpen((v) => !v), [])

  const handleInspectorClick = useCallback(
    (v: DocumentEnhancement) => {
      onClick?.(v)
    },
    [onClick]
  )

  useClickOutside(() => {
    if ('view' in enhancement && enhancement.view.type === 'popover') {
      setOpen(false)
    }
  }, [popoverElement, buttonElement])

  const useHook = useMemo(() => {
    if ('use' in enhancement) {
      return enhancement.use
    }

    return () => ({} as any)
  }, [enhancement])

  const hookMenuItem = useHook?.({documentId, documentType})

  const buttonProps: ButtonProps & {onClick: () => void} = useMemo(() => {
    if ('menuItem' in enhancement && enhancement.view.type === 'inspector') {
      return {
        ...enhancement.menuItem,
        text: enhancement.menuItem.title,
        onClick: () => handleInspectorClick(enhancement),
      }
    }

    if ('menuItem' in enhancement) {
      return {
        ...enhancement.menuItem,
        text: enhancement.menuItem.title,
        onClick: handleToggleOpen,
      }
    }

    return {
      ...hookMenuItem,
      text: hookMenuItem.title,
      onClick: hookMenuItem.onClick,
    }
  }, [enhancement, hookMenuItem, handleInspectorClick, handleToggleOpen])

  const viewComponent = useMemo(() => {
    if (!('view' in enhancement) || !enhancement.view.component) return null

    const component = createElement(enhancement.view.component, {onClose: () => setOpen(false)})

    if (enhancement.view.type === 'dialog' && open) {
      return (
        <Dialog id="" onClose={handleToggleOpen} portal={DOCUMENT_PANEL_PORTAL_ELEMENT}>
          {component}
        </Dialog>
      )
    }

    if (enhancement.view.type === 'popover') {
      return (
        <Popover
          content={component}
          open={open}
          placement="top"
          portal
          ref={setPopoverElement}
          referenceElement={buttonElement}
        />
      )
    }

    return null
  }, [buttonElement, handleToggleOpen, open, enhancement])

  if (isMenuContext) {
    return (
      <>
        <MenuItem {...buttonProps} ref={setButtonElement} />
        {viewComponent}
      </>
    )
  }

  return (
    <>
      <Button {...buttonProps} ref={setButtonElement} />
      {viewComponent}
    </>
  )
}
