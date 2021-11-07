import {AddIcon} from '@sanity/icons'
import {ReferenceSchemaType, SchemaType} from '@sanity/types'
import {Box, Button, Inline, Menu, MenuButton, MenuItem} from '@sanity/ui'
import React, {memo, useCallback, useMemo} from 'react'
import {useReferenceInputOptions} from '../../sanity/contexts/ReferenceInputOptions'

export interface NewReferenceOptions {
  templateType: SchemaType
  templateId: string
  templateParams: unknown
}

interface CreateNewButtonProps {
  inputId: string
  type: ReferenceSchemaType
  onCreateNew: (options: NewReferenceOptions) => void
  onCancel: () => void
}

export const CreateNewButton = memo(
  ({inputId, type, onCreateNew, onCancel}: CreateNewButtonProps) => {
    const handleCreateButtonKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          onCancel()
        }
      },
      [onCancel]
    )

    const {newDocumentOptions, useFilteredCreatableTypes} = useReferenceInputOptions()

    const filteredDocumentOptions = useMemo(() => {
      if (!newDocumentOptions) return null

      const schemaTypes = new Set(type.to.map((toType) => toType.name))
      return newDocumentOptions.filter((option) => schemaTypes.has(option.template.schemaType))
    }, [newDocumentOptions, type.to])

    const uniqueTypes = useMemo(() => {
      return Array.from(new Set(filteredDocumentOptions.map(({template}) => template.schemaType)))
    }, [filteredDocumentOptions])
    const permissions = useFilteredCreatableTypes(uniqueTypes)
    const allowedTypes = useMemo(() => {
      return new Set(
        (permissions || [])
          .filter((permission) => permission.granted)
          .map((permission) => permission.typeName)
      )
    }, [permissions])

    // don't render the create button if no new-document options are allowed
    if (!filteredDocumentOptions) return null
    const [firstOption] = filteredDocumentOptions

    return (
      <Box marginLeft={2}>
        <Inline space={2}>
          {filteredDocumentOptions.length === 1 ? (
            <Button
              text="Create new"
              mode="ghost"
              title={`Create new ${firstOption.title}`}
              onKeyDown={handleCreateButtonKeyDown}
              icon={AddIcon}
              disabled={!allowedTypes.has(firstOption.type.name)}
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => {
                onCreateNew({
                  templateId: firstOption.template.id,
                  templateParams: firstOption.item.parameters,
                  templateType: firstOption.type,
                })
              }}
            />
          ) : (
            <MenuButton
              button={
                <Button
                  text="Create new…"
                  mode="ghost"
                  icon={AddIcon}
                  onKeyDown={handleCreateButtonKeyDown}
                />
              }
              id={`${inputId}-selectTypeMenuButton`}
              menu={
                <Menu>
                  {filteredDocumentOptions.map((option) => (
                    <MenuItem
                      key={option.key}
                      text={option.title}
                      icon={option.icon}
                      disabled={!allowedTypes.has(option.type.name)}
                      // eslint-disable-next-line react/jsx-no-bind
                      onClick={() =>
                        onCreateNew({
                          templateId: option.template.id,
                          templateParams: option.item.parameters,
                          templateType: option.type,
                        })
                      }
                    />
                  ))}
                </Menu>
              }
              placement="right"
              popover={{portal: true, tone: 'default'}}
            />
          )}
        </Inline>
      </Box>
    )
  }
)

CreateNewButton.displayName = 'CreateNewButton'
