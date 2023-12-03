import {AddIcon} from '@sanity/icons'
import React, {useMemo, forwardRef} from 'react'
import {Menu, MenuButton, PopoverProps} from '@sanity/ui'
import {Schema} from '@sanity/types'
import {Button, MenuItem} from '../../../ui'
import {IntentButton} from '../IntentButton'
import {structureLocaleNamespace} from '../../i18n'
import {InsufficientPermissionsMessageTooltip} from './InsufficientPermissionsMessageTooltip'
import {IntentLink} from 'sanity/router'
import {
  useTemplatePermissions,
  TemplatePermissionsResult,
  Template,
  InitialValueTemplateItem,
  useSchema,
  useTemplates,
  useTranslation,
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
  const {t} = useTranslation(structureLocaleNamespace)

  const [templatePermissions, isTemplatePermissionsLoading] = useTemplatePermissions({
    templateItems,
  })

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

  if (nothingGranted) {
    return (
      <InsufficientPermissionsMessageTooltip
        context="create-document-type"
        reveal
        loading={isTemplatePermissionsLoading}
      >
        <Button
          aria-label={t('pane-header.disabled-created-button.aria-label')}
          icon={AddIcon}
          data-testid="action-intent-button"
          disabled
          mode="bleed"
          // This button handles the tooltip in a special way, won't reuse the forced tooltip.
          tooltipProps={null}
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
        context="create-document-type"
      >
        <IntentButton
          aria-label={firstItem.title}
          icon={firstItem.icon || AddIcon}
          intent={intent}
          mode="bleed"
          disabled={disabled}
          data-testid="action-intent-button"
          tooltipProps={disabled ? null : {content: t('pane-header.create-new-button.tooltip')}}
        />
      </InsufficientPermissionsMessageTooltip>
    )
  }

  return (
    <MenuButton
      button={
        <Button
          icon={AddIcon}
          mode="bleed"
          data-testid="multi-action-intent-button"
          tooltipProps={{content: t('pane-header.create-new-button.tooltip')}}
        />
      }
      id="create-menu"
      menu={
        <Menu>
          {templateItems.map((item, itemIndex) => {
            const permissions = permissionsById[item.id]
            const disabled = !permissions?.granted
            const intent = getIntent(schema, templates, item)
            const template = templates.find((i) => i.id === item.templateId)
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
                context="create-document-type"
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
