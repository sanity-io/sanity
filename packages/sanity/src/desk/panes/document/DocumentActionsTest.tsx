import {
  Box,
  Button,
  ButtonProps,
  Dialog,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  Popover,
} from '@sanity/ui'
import React, {HTMLProps, createElement, useCallback, useMemo, useState} from 'react'
import {EllipsisVerticalIcon} from '@sanity/icons'
// eslint-disable-next-line boundaries/element-types
import {useEditState} from '../../../core'
// eslint-disable-next-line boundaries/element-types
import {DocumentAction2} from '../../../core/config/document/actions2'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../constants'
import {useDocumentPane} from './useDocumentPane'

function DocumentActionButton(props: {
  action: DocumentAction2
  documentId: string
  schemaType: string
  context: 'default' | 'menu'
}) {
  const {action, documentId, schemaType, context} = props
  const {draft, published} = useEditState(documentId, schemaType)

  const [open, setOpen] = useState<boolean>(false)
  const [buttonElement, setButtonElement] = useState<HTMLElement | null>(null)

  const useHook = useMemo(() => {
    if ('use' in action) {
      return action.use
    }

    return () => ({} as any)
  }, [action])

  const hookValues = useHook?.({
    documentId,
    documentType: schemaType,
    draft,
    published,
  })

  const handleClick = useCallback(() => {
    setOpen((v) => !v)
  }, [])

  const btnProps: ButtonProps &
    Omit<HTMLProps<HTMLDivElement | HTMLButtonElement>, 'as' | 'type' | 'tabIndex' | 'ref'> =
    useMemo(() => {
      if ('menuItem' in action) {
        return {
          ...action.menuItem,
          text: action.menuItem?.title,
          onClick: handleClick,
        }
      }

      return {...hookValues, text: hookValues.title}
    }, [action, handleClick, hookValues])

  const component = useMemo(() => {
    if ('view' in action && action.view.component) {
      const element = createElement(action.view.component)

      if (action.view.type === 'dialog' && open) {
        return (
          <Dialog
            id="test"
            onClose={() => setOpen(false)}
            portal={DOCUMENT_PANEL_PORTAL_ELEMENT}
            title="Test"
          >
            {element}
          </Dialog>
        )
      }

      if (action.view.type === 'popover' && open) {
        return <Popover content={element} referenceElement={buttonElement} open={open} portal />
      }
    }

    return null
  }, [action, buttonElement, open])

  if (context === 'menu') {
    return (
      <>
        <MenuItem {...btnProps} ref={setButtonElement} />
        <>{component}</>
      </>
    )
  }

  return (
    <>
      <Button {...btnProps} ref={setButtonElement} />
      <>{component}</>
    </>
  )
}

export function DocumentActionsTest() {
  const {actions2, documentId, schemaType} = useDocumentPane()

  const menuItems = actions2?.filter((action) => action.context === 'menu')
  const defaultItems = actions2?.filter((action) => !action.context)

  return (
    <Flex gap={2} justify="flex-end">
      {defaultItems?.map((action) => {
        return (
          <DocumentActionButton
            action={action}
            documentId={documentId}
            key={action.name}
            schemaType={schemaType.name}
            context="default"
          />
        )
      })}

      {(menuItems || [])?.length > 0 && (
        <MenuButton
          id="test"
          button={<Button mode="ghost" icon={EllipsisVerticalIcon} />}
          menu={
            <Menu>
              {menuItems?.map((action) => {
                return (
                  <DocumentActionButton
                    action={action}
                    documentId={documentId}
                    key={action.name}
                    schemaType={schemaType.name}
                    context="menu"
                  />
                )
              })}
            </Menu>
          }
        />
      )}
    </Flex>
  )
}
