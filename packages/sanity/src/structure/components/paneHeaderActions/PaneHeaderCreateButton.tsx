import {AddIcon} from '@sanity/icons/Add'
import {Menu} from '@sanity/ui/menu'
import {useMemo} from 'react'
import {
  type InitialValueTemplateItem,
  type ReleaseId,
  type Template,
  type TemplatePermissionsResult,
  useGetI18nText,
  usePerspective,
  useSchema,
  useTemplatePermissions,
  useTemplates,
  useTranslation,
  IntentButton,
  isReleaseVersionAllowed,
  isVariantVersionAllowed,
} from 'sanity'
import {IntentLink, type IntentLinkProps} from 'sanity/router'

import {Button} from '../../../ui-components/button/Button'
import {MenuButton} from '../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../ui-components/menuItem/MenuItem'
import {type PopoverProps} from '../../../ui-components/popover/Popover'
import {structureLocaleNamespace} from '../../i18n'
import {InsufficientPermissionsMessageTooltip} from './InsufficientPermissionsMessageTooltip'

const POPOVER_PROPS: PopoverProps = {
  constrainSize: true,
  placement: 'bottom',
  portal: true,
}

const getIntentProps = (
  templates: Template[],
  item: InitialValueTemplateItem,
  version?: ReleaseId,
): IntentLinkProps | null => {
  const typeName = templates.find((t) => t.id === item.templateId)?.schemaType
  if (!typeName) return null

  const baseParams = {
    template: item.templateId,
    type: typeName,
    version,
    id: item.initialDocumentId,
  }

  return {
    intent: 'create',
    params: item.parameters ? [baseParams, item.parameters] : baseParams,
    searchParams: version ? [['perspective', version]] : undefined,
  }
}

interface PaneHeaderCreateButtonProps {
  templateItems: InitialValueTemplateItem[]
}

export function PaneHeaderCreateButton({templateItems}: PaneHeaderCreateButtonProps) {
  const templates = useTemplates()
  const schema = useSchema()
  const {selectedReleaseId, selectedVariantNames} = usePerspective()

  const {t} = useTranslation(structureLocaleNamespace)
  const getUnsupportedReason = (item: InitialValueTemplateItem) => {
    const typeName = templates.find((template) => template.id === item.templateId)?.schemaType
    const schemaType = typeName ? schema.get(typeName) : undefined
    if (selectedReleaseId && !isReleaseVersionAllowed(schemaType)) {
      return t('pane-header.create-new-button.releases-not-supported')
    }
    if (selectedVariantNames.length > 0 && !isVariantVersionAllowed(schemaType)) {
      return t('pane-header.create-new-button.variants-not-supported')
    }
    return undefined
  }
  const getI18nText = useGetI18nText([...templateItems, ...templates])

  const [templatePermissions, isTemplatePermissionsLoading] = useTemplatePermissions({
    templateItems,
  })

  const nothingGranted = useMemo(() => {
    return (
      !isTemplatePermissionsLoading &&
      templatePermissions?.length !== 0 &&
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

  if (templateItems.length === 0) return null

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
    const unsupportedReason = getUnsupportedReason(firstItem)
    const disabled = !permissions?.granted || Boolean(unsupportedReason)
    const intent = getIntentProps(templates, firstItem, selectedReleaseId)
    if (!intent) return null

    return (
      <InsufficientPermissionsMessageTooltip
        reveal={disabled && !unsupportedReason}
        loading={isTemplatePermissionsLoading}
        context="create-document-type"
      >
        <IntentButton
          {...intent}
          aria-label={getI18nText(firstItem).title}
          icon={AddIcon}
          mode="bleed"
          disabled={disabled}
          data-testid="action-intent-button"
          tooltipProps={{
            content: unsupportedReason ?? t('pane-header.create-new-button.tooltip'),
          }}
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
            const unsupportedReason = getUnsupportedReason(item)
            const disabled = !permissions?.granted || Boolean(unsupportedReason)
            const intent = getIntentProps(templates, item, selectedReleaseId)
            const template = templates.find((i) => i.id === item.templateId)
            if (!template || !intent) return null

            const {title} = getI18nText({
              ...item,
              // replace the title with the template title
              title: item.title || getI18nText(template).title,
            })

            return (
              <InsufficientPermissionsMessageTooltip
                key={item.id}
                context="create-document-type"
                reveal={disabled && !unsupportedReason}
                loading={isTemplatePermissionsLoading}
              >
                {disabled ? (
                  <MenuItem
                    as="button"
                    data-as="button"
                    icon={item.icon}
                    text={title}
                    aria-label={
                      unsupportedReason ?? t('pane-header.disabled-created-button.aria-label')
                    }
                    disabled
                    data-testid={`action-intent-button-${itemIndex}`}
                    tooltipProps={unsupportedReason ? {content: unsupportedReason} : undefined}
                  />
                ) : (
                  <MenuItem
                    as={IntentLink}
                    {...intent}
                    data-as="a"
                    icon={item.icon}
                    text={title}
                    aria-label={title}
                    data-testid={`action-intent-button-${itemIndex}`}
                  />
                )}
              </InsufficientPermissionsMessageTooltip>
            )
          })}
        </Menu>
      }
      popover={POPOVER_PROPS}
    />
  )
}
