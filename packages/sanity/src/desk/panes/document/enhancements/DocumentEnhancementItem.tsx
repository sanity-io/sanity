import {useClickOutside, ButtonProps, Dialog, Popover, MenuItem, Button} from '@sanity/ui'
import React, {createElement, useCallback, useEffect, useMemo, useState} from 'react'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../constants'
import {DocumentEnhancement} from 'sanity'

interface DocumentEnhancementItemProps {
  enhancement: DocumentEnhancement
  documentId: string
  documentType: string
  onClick?: (enhancement: DocumentEnhancement | null) => void
  onOpenChange: (open: boolean) => void
}

export function DocumentEnhancementItem(props: DocumentEnhancementItemProps) {
  const {documentId, documentType, enhancement, onClick, onOpenChange} = props
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
    if ('view' in enhancement && enhancement?.view?.type === 'popover') {
      setOpen(false)
    }
  }, [popoverElement, buttonElement])

  const hookMenuItem = enhancement.useMenuItem?.({
    documentId,
    documentType,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    isOpen: open,
  })

  useEffect(() => {
    if (enhancement?.view?.type === 'inspector') {
      onOpenChange?.(open)
    }
  }, [enhancement?.view?.type, onOpenChange, open])

  const buttonProps: ButtonProps & {onClick: () => void} = useMemo(() => {
    return {
      ...hookMenuItem,
      text: hookMenuItem.title,
      onClick: () => {
        hookMenuItem.onClick?.()

        if (enhancement?.view?.type === 'inspector') {
          handleInspectorClick(enhancement)
        }
      },
    }
  }, [enhancement, hookMenuItem, handleInspectorClick])

  const viewComponent = useMemo(() => {
    if (!('view' in enhancement) || !enhancement?.view?.component) return null

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
