import {Button, Flex, Menu, MenuButton, MenuItem} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {
  useClient,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  useDocumentOperation,
  useEditState,
  useDocumentStore,
} from '../../../core'
import {DocumentAction2} from '../../../core/config/document/actions2'
import {useDocumentPane} from './useDocumentPane'
import {EllipsisVerticalIcon, IceCreamIcon} from '@sanity/icons'

function DocumentActionButton(props: {
  action: DocumentAction2
  documentId: string
  schemaType: string
  context: 'default' | 'menu'
}) {
  const {menuItem, onAction} = props.action
  const {documentId, schemaType, context} = props
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [loading, setLoading] = useState<boolean>(false)

  const {draft, published} = useEditState(documentId, schemaType)
  const operations = useDocumentOperation(documentId, schemaType)

  const documentStore = useDocumentStore()

  const handleClick = useCallback(() => {
    try {
      onAction({
        id: documentId,
        type: schemaType,
        client: client,
        operations: operations,
        draft,
        published,
        documentStore,
        onActionStart: () => setLoading(true),
        onActionEnd: () => setLoading(false),
      })
    } catch (error) {
      setLoading(false)
    }
  }, [client, documentId, documentStore, draft, onAction, operations, published, schemaType])

  const resolvedMenuItem = useMemo(() => {
    if (typeof menuItem === 'function')
      return menuItem({loading, draft, published, id: documentId, type: schemaType})
    return menuItem
  }, [documentId, draft, loading, menuItem, published, schemaType])

  if (context === 'menu') {
    return (
      <MenuItem
        disabled={resolvedMenuItem?.disabled}
        icon={resolvedMenuItem?.icon}
        onClick={handleClick}
        text={resolvedMenuItem?.title}
        tone={resolvedMenuItem?.tone}
      />
    )
  }

  return (
    <Button
      disabled={resolvedMenuItem?.disabled}
      icon={resolvedMenuItem?.icon}
      onClick={handleClick}
      text={resolvedMenuItem?.title}
      tone={resolvedMenuItem?.tone}
    />
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
