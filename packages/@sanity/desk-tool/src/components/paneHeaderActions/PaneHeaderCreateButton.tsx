import {getTemplateById} from '@sanity/base/initial-value-templates'
import {ComposeIcon} from '@sanity/icons'
import {InitialValueTemplateItem} from '@sanity/structure'
import React, {useMemo, forwardRef} from 'react'
import {unstable_useTemplatePermissions as useTemplatePermissions} from '@sanity/base/hooks'
import {Box, Button, Label, Menu, MenuButton, MenuItem, PopoverProps} from '@sanity/ui'
import {IntentLink} from '@sanity/base/router'
import {IntentButton} from '../IntentButton'
import {InsufficientPermissionsMessageTooltip} from './InsufficientPermissionsMessageTooltip'

const POPOVER_PROPS: PopoverProps = {
  constrainSize: true,
  placement: 'bottom',
  portal: true,
}
type Intent = React.ComponentProps<typeof IntentButton>['intent']

const getIntent = (item: InitialValueTemplateItem): Intent | null => {
  const typeName = getTemplateById(item.id)?.schemaType
  if (!typeName) return null

  return {
    type: 'create',
    params: item.parameters
      ? [{template: item.templateId, type: typeName}, item.parameters]
      : {template: item.templateId, type: typeName},
  }
}

interface PaneHeaderCreateButtonProps {
  initialValueTemplateItems: InitialValueTemplateItem[]
}

export function PaneHeaderCreateButton({initialValueTemplateItems}: PaneHeaderCreateButtonProps) {
  const [templatePermissions, isTemplatePermissionsLoading] = useTemplatePermissions(
    initialValueTemplateItems
  )
  const nothingGranted = useMemo(() => {
    return (
      !isTemplatePermissionsLoading &&
      Object.values(templatePermissions || {}).every((value) => !value.granted)
    )
  }, [isTemplatePermissionsLoading, templatePermissions])

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
    const permissions = templatePermissions?.[firstItem.templateId]
    const disabled = !permissions?.granted
    const intent = getIntent(firstItem)
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
            const permissions = templatePermissions?.[item.templateId]
            const disabled = !permissions?.granted
            const intent = getIntent(item)
            const template = getTemplateById(item.templateId)
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
