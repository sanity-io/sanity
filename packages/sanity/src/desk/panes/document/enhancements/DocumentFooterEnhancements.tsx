import React, {createElement, useCallback, useMemo, useState} from 'react'
import {
  Button,
  ButtonProps,
  Card,
  Dialog,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  Popover,
  useClickOutside,
} from '@sanity/ui'
import {EllipsisVerticalIcon} from '@sanity/icons'
import {useDocumentPane} from '../useDocumentPane'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../constants'
import {DocumentEnhancement} from 'sanity'

function Item(props: DocumentEnhancement & {documentId: string; documentType: string}) {
  const {documentId, documentType} = props
  const isMenuContext = props.context === 'menu'
  const [open, setOpen] = useState<boolean>(false)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)
  const [popoverElement, setPopoverElement] = useState<HTMLElement | null>(null)

  const handleToggleOpen = useCallback(() => setOpen((v) => !v), [])

  useClickOutside(() => setOpen(false), [popoverElement, buttonElement])

  const useHook = useMemo(() => {
    if ('use' in props) {
      return props.use
    }

    return () => ({} as any)
  }, [props])

  const hookMenuItem = useHook?.({documentId, documentType})

  const buttonProps: ButtonProps & {onClick: () => void} = useMemo(() => {
    if ('menuItem' in props) {
      return {
        ...props.menuItem,
        text: props.menuItem.title,
        onClick: handleToggleOpen,
      }
    }

    return {
      ...hookMenuItem,
      text: hookMenuItem.title,
      onClick: hookMenuItem.onClick,
    }
  }, [handleToggleOpen, hookMenuItem, props])

  const viewComponent = useMemo(() => {
    if (!('view' in props) || !props.view.component) return null

    const component = createElement(props.view.component)

    if (props.view.type === 'dialog' && open) {
      return (
        <Dialog id="" onClose={handleToggleOpen} portal={DOCUMENT_PANEL_PORTAL_ELEMENT}>
          {component}
        </Dialog>
      )
    }

    if (props.view.type === 'popover') {
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
  }, [buttonElement, handleToggleOpen, open, props])

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

export function DocumentFooterEnhancements() {
  const {enhancements, documentId, documentType} = useDocumentPane()

  const defaultItems = useMemo(
    () => enhancements?.filter((v) => v.context !== 'menu'),
    [enhancements]
  )

  const menuItems = useMemo(
    () => enhancements?.filter((v) => v.context === 'menu') || [],
    [enhancements]
  )

  return (
    <Card padding={2} borderTop>
      <Flex gap={2} justify="flex-end">
        {defaultItems?.map((v) => (
          <Item {...v} key={v.name} documentId={documentId} documentType={documentType} />
        ))}

        {menuItems.length > 0 && (
          <MenuButton
            id=""
            button={<Button icon={EllipsisVerticalIcon} />}
            menu={
              <Menu>
                {menuItems?.map((v) => (
                  <Item {...v} key={v.name} documentId={documentId} documentType={documentType} />
                ))}
              </Menu>
            }
          />
        )}
      </Flex>
    </Card>
  )
}
