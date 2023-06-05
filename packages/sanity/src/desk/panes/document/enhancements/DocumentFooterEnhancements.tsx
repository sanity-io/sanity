import React, {useMemo} from 'react'
import {Button, Card, Flex, Menu, MenuButton} from '@sanity/ui'
import {EllipsisVerticalIcon} from '@sanity/icons'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentEnhancementItem} from './DocumentEnhancementItem'
import {DocumentEnhancement} from 'sanity'

interface DocumentFooterDocumentEnhancementsProps {
  onEnhancementSelect?: (enhancement: DocumentEnhancement | null) => void
  onOpenChange: (open: boolean) => void
}

export function DocumentFooterEnhancements(props: DocumentFooterDocumentEnhancementsProps) {
  const {onEnhancementSelect, onOpenChange} = props
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
          <DocumentEnhancementItem
            {...v}
            documentId={documentId}
            documentType={documentType}
            enhancement={v}
            key={v.name}
            onClick={onEnhancementSelect}
            onOpenChange={onOpenChange}
          />
        ))}

        {menuItems.length > 0 && (
          <MenuButton
            id=""
            button={<Button icon={EllipsisVerticalIcon} />}
            menu={
              <Menu>
                {menuItems?.map((v) => (
                  <DocumentEnhancementItem
                    {...v}
                    documentId={documentId}
                    documentType={documentType}
                    enhancement={v}
                    key={v.name}
                    onClick={onEnhancementSelect}
                    onOpenChange={onOpenChange}
                  />
                ))}
              </Menu>
            }
          />
        )}
      </Flex>
    </Card>
  )
}
