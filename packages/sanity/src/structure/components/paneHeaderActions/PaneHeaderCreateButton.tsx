import {AddIcon} from '@sanity/icons'
import {type Schema} from '@sanity/types'
import {Menu} from '@sanity/ui'
import {type ComponentProps, type ForwardedRef, forwardRef, useMemo} from 'react'
import {
  type InitialValueTemplateItem,
  isDraftPerspective,
  isPublishedPerspective,
  type Template,
  type TemplatePermissionsResult,
  useGetI18nText,
  useSchema,
  useStudioPerspectiveState,
  useTemplatePermissions,
  useTemplates,
  useTranslation,
} from 'sanity'
import {IntentLink} from 'sanity/router'

import {Button, MenuButton, MenuItem, type PopoverProps} from '../../../ui-components'
import {structureLocaleNamespace} from '../../i18n'
import {IntentButton} from '../IntentButton'
import {InsufficientPermissionsMessageTooltip} from './InsufficientPermissionsMessageTooltip'

export type PaneHeaderIntentProps = ComponentProps<typeof IntentButton>['intent']

const POPOVER_PROPS: PopoverProps = {
  constrainSize: true,
  placement: 'bottom',
  portal: true,
}

const getIntent = (
  schema: Schema,
  templates: Template[],
  item: InitialValueTemplateItem,
  version?: string,
): PaneHeaderIntentProps | null => {
  const isReleaseIntent =
    version && !isDraftPerspective(version) && !isPublishedPerspective(version)
  const typeName = templates.find((t) => t.id === item.templateId)?.schemaType
  if (!typeName) return null

  const baseParams = {
    template: item.templateId,
    type: typeName,
    version: isReleaseIntent ? version : undefined,
    id: item.initialDocumentId,
  }

  return {
    type: 'create',
    params: item.parameters ? [baseParams, item.parameters] : baseParams,
    searchParams: isReleaseIntent ? [['perspective', version]] : undefined,
  }
}

interface PaneHeaderCreateButtonProps {
  templateItems: InitialValueTemplateItem[]
}

export function PaneHeaderCreateButton({templateItems}: PaneHeaderCreateButtonProps) {
  const schema = useSchema()
  const templates = useTemplates()
  const {current} = useStudioPerspectiveState()

  const {t} = useTranslation(structureLocaleNamespace)
  const getI18nText = useGetI18nText([...templateItems, ...templates])

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
    const intent = getIntent(schema, templates, firstItem, current)
    if (!intent) return null

    return (
      <InsufficientPermissionsMessageTooltip
        reveal={disabled}
        loading={isTemplatePermissionsLoading}
        context="create-document-type"
      >
        <IntentButton
          aria-label={getI18nText(firstItem).title}
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
            const intent = getIntent(schema, templates, item, current)
            const template = templates.find((i) => i.id === item.templateId)
            if (!template || !intent) return null

            const Link = forwardRef((linkProps, linkRef: ForwardedRef<never>) =>
              disabled ? (
                <button type="button" disabled {...linkProps} ref={linkRef} />
              ) : (
                <IntentLink
                  {...linkProps}
                  intent={intent.type}
                  params={intent.params}
                  searchParams={intent.searchParams}
                  ref={linkRef}
                />
              ),
            )

            Link.displayName = 'Link'

            const {title} = getI18nText({
              ...item,
              // replace the title with the template title
              title: item.title || getI18nText(template).title,
            })

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
                  text={title}
                  aria-label={
                    disabled ? t('pane-header.disabled-created-button.aria-label') : title
                  }
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
