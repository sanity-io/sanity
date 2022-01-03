import {getTemplateById, Template} from '@sanity/base/initial-value-templates'
import {ComposeIcon} from '@sanity/icons'
import {InitialValueTemplateItem} from '@sanity/base/structure'
import React, {useMemo, forwardRef} from 'react'
import {unstable_useTemplatePermissions as useTemplatePermissions} from '@sanity/base/hooks'
import {TemplatePermissionsResult} from '@sanity/base/_internal'
import {Box, Button, Label, Menu, MenuButton, MenuItem, PopoverProps} from '@sanity/ui'
import {IntentLink} from '@sanity/base/router'
import {useConfig, useDatastores} from '@sanity/base'
import {Schema} from '@sanity/types'
import {IntentButton} from '../IntentButton'
import {InsufficientPermissionsMessageTooltip} from './InsufficientPermissionsMessageTooltip'

type Intent = React.ComponentProps<typeof IntentButton>['intent']

const POPOVER_PROPS: PopoverProps = {
  constrainSize: true,
  placement: 'bottom',
  portal: true,
}

const getIntent = (
  schema: Schema,
  initialValueTemplates: Template[],
  item: InitialValueTemplateItem
): Intent | null => {
  const typeName = getTemplateById(schema, initialValueTemplates, item.templateId)?.schemaType
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
  initialValueTemplateItems: InitialValueTemplateItem[]
}

export function PaneHeaderCreateButton({initialValueTemplateItems}: PaneHeaderCreateButtonProps) {
  const {
    data: {initialValueTemplates},
    schema,
  } = useConfig()
  const {grantsStore} = useDatastores()

  const [templatePermissions, isTemplatePermissionsLoading] = useTemplatePermissions(
    grantsStore,
    schema,
    initialValueTemplates,
    initialValueTemplateItems
  )

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
      {}
    )
  }, [templatePermissions])

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

  if (initialValueTemplateItems.length === 1) {
    const firstItem = initialValueTemplateItems[0]
    const permissions = permissionsById[firstItem.id]
    const disabled = !permissions?.granted
    const intent = getIntent(schema, initialValueTemplates, firstItem)
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
    <MenuButton
      button={
        <Button
          icon={ComposeIcon}
          mode="bleed"
          padding={3}
          data-testid="multi-action-intent-button"
        />
      }
      id="create-menu"
      menu={
        <Menu>
          <Box paddingX={3} paddingTop={3} paddingBottom={2}>
            <Label muted>Create</Label>
          </Box>

          {initialValueTemplateItems.map((item, itemIndex) => {
            const permissions = permissionsById[item.id]
            const disabled = !permissions?.granted
            const intent = getIntent(schema, initialValueTemplates, item)
            const template = getTemplateById(schema, initialValueTemplates, item.templateId)
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
              )
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
                  aria-label={disabled ? 'Insufficient permissions' : item.title || template.title}
                  disabled={disabled}
                  data-testid={`action-intent-button-${itemIndex}`}
                />
              </InsufficientPermissionsMessageTooltip>
            )
          })}
        </Menu>
      }
      popover={POPOVER_PROPS}
    />
  )
}
