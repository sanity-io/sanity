import {ComposeIcon} from '@sanity/icons'
import React, {useMemo, forwardRef, useCallback, useState} from 'react'
import {Menu, MenuButton, PopoverProps} from '@sanity/ui'
import {Schema} from '@sanity/types'
import {Button, MenuItem, Tooltip} from '../../../ui'
import {IntentButton} from '../IntentButton'
import {InsufficientPermissionsMessageTooltip} from './InsufficientPermissionsMessageTooltip'
import {IntentLink} from 'sanity/router'
import {
  useTemplatePermissions,
  TemplatePermissionsResult,
  Template,
  InitialValueTemplateItem,
  useSchema,
  useTemplates,
} from 'sanity'

export type PaneHeaderIntentProps = React.ComponentProps<typeof IntentButton>['intent']

const POPOVER_PROPS: PopoverProps = {
  constrainSize: true,
  placement: 'bottom',
  portal: true,
}

const getIntent = (
  schema: Schema,
  templates: Template[],
  item: InitialValueTemplateItem,
): PaneHeaderIntentProps | null => {
  const typeName = templates.find((t) => t.id === item.templateId)?.schemaType
  if (!typeName) return null

  const baseParams = {
    template: item.templateId,
    type: typeName,
    id: item.initialDocumentId,
  }

  return {
    type: 'create',
    params: item.parameters ? [baseParams, item.parameters] : baseParams,
  }
}

interface PaneHeaderCreateButtonProps {
  templateItems: InitialValueTemplateItem[]
}

export function PaneHeaderCreateButton({templateItems}: PaneHeaderCreateButtonProps) {
  const schema = useSchema()
  const templates = useTemplates()

  const [templatePermissions, isTemplatePermissionsLoading] = useTemplatePermissions({
    templateItems,
  })

  const [menuOpen, setMenuOpen] = useState(false)

  const nothingGranted = useMemo(() => {
    return (
      !isTemplatePermissionsLoading &&
      templatePermissions?.every((permission) => !permission.granted)
    )
  }, [isTemplatePermissionsLoading, templatePermissions])

  const permissionsById = useMemo(() => {
    if (!templatePermissions) return {}
    return templatePermissions.reduce<Record<string, TemplatePermissionsResult | undefined>>(
      (acc, permission) => {
        acc[permission.id] = permission
        return acc
      },
      {},
    )
  }, [templatePermissions])

  const handleOpen = useCallback(() => setMenuOpen(true), [])
  const handleClose = useCallback(() => setMenuOpen(false), [])

  if (nothingGranted) {
    return (
      <InsufficientPermissionsMessageTooltip reveal loading={isTemplatePermissionsLoading}>
        <Button
          aria-label="Insufficient permissions"
          icon={ComposeIcon}
          mode="bleed"
          disabled
          data-testid="action-intent-button"
        />
      </InsufficientPermissionsMessageTooltip>
    )
  }

  if (templateItems.length === 1) {
    const firstItem = templateItems[0]
    const permissions = permissionsById[firstItem.id]
    const disabled = !permissions?.granted
    const intent = getIntent(schema, templates, firstItem)
    if (!intent) return null

    return (
      <InsufficientPermissionsMessageTooltip
        reveal={disabled}
        loading={isTemplatePermissionsLoading}
      >
        <IntentButton
          aria-label={firstItem.title}
          icon={firstItem.icon || ComposeIcon}
          intent={intent}
          mode="bleed"
          disabled={disabled}
          data-testid="action-intent-button"
        />
      </InsufficientPermissionsMessageTooltip>
    )
  }

  return (
    <Tooltip content="Create new document" disabled={menuOpen}>
      <div>
        <MenuButton
          button={
            <Button icon={ComposeIcon} mode="bleed" data-testid="multi-action-intent-button" />
          }
          id="create-menu"
          menu={
            <Menu>
              {templateItems.map((item, itemIndex) => {
                const permissions = permissionsById[item.id]
                const disabled = !permissions?.granted
                const intent = getIntent(schema, templates, item)
                const template = templates.find((t) => t.id === item.templateId)
                if (!template || !intent) return null

                const Link = forwardRef((linkProps, linkRef: React.ForwardedRef<never>) =>
                  disabled ? (
                    <button type="button" disabled {...linkProps} ref={linkRef} />
                  ) : (
                    <IntentLink
                      {...linkProps}
                      intent={intent.type}
                      params={intent.params}
                      ref={linkRef}
                    />
                  ),
                )

                Link.displayName = 'Link'

                return (
                  <InsufficientPermissionsMessageTooltip
                    key={item.id}
                    reveal={disabled}
                    loading={isTemplatePermissionsLoading}
                  >
                    <MenuItem
                      as={Link}
                      data-as={disabled ? 'button' : 'a'}
                      text={item.title || template.title}
                      aria-label={
                        disabled ? 'Insufficient permissions' : item.title || template.title
                      }
                      disabled={disabled}
                      data-testid={`action-intent-button-${itemIndex}`}
                    />
                  </InsufficientPermissionsMessageTooltip>
                )
              })}
            </Menu>
          }
          onClose={handleClose}
          onOpen={handleOpen}
          popover={POPOVER_PROPS}
        />
      </div>
    </Tooltip>
  )
}
