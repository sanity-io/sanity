import {ChevronDownIcon, CogIcon, CopyIcon, TiersIcon, TrashIcon} from '@sanity/icons'
import {Flex, Menu, MenuDivider, Text} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {styled} from 'styled-components'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {useReleaseTemplateOperations} from '../templates'
import {type ReleaseTemplateDocument} from '../templates/types'
import {CreateTemplateDialog} from './CreateTemplateDialog'
import {ManageTemplatesDialog} from './ManageTemplatesDialog'

export interface TemplateMenuButtonProps {
  children: ReactNode
  disabled?: boolean
  onUseTemplate?: (template: ReleaseTemplateDocument) => void
}

const ButtonGroup = styled(Flex)`
  & > *:first-child button {
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
  }

  & > *:last-child button {
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
    border-left: 1px solid var(--card-border-color) !important;
  }
`

/**
 * A combined button that integrates the main action with template options in a dropdown.
 *
 * @internal
 */
export function TemplateMenuButton(props: TemplateMenuButtonProps) {
  const {children, disabled, onUseTemplate} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {list: listTemplates, remove: removeTemplate} = useReleaseTemplateOperations()
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState(false)
  const [isManageTemplatesDialogOpen, setIsManageTemplatesDialogOpen] = useState(false)
  const [templates, setTemplates] = useState<ReleaseTemplateDocument[]>([])

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateList = await listTemplates()
        setTemplates(templateList)
      } catch (err) {
        console.error('Failed to load templates:', err)
      }
    }

    loadTemplates()
  }, [listTemplates])

  const handleCreateTemplate = useCallback(() => {
    setIsCreateTemplateDialogOpen(true)
  }, [])

  const handleCloseTemplateDialog = useCallback(() => {
    setIsCreateTemplateDialogOpen(false)
  }, [])

  const handleSubmitTemplate = useCallback(
    (templateId: string) => {
      setIsCreateTemplateDialogOpen(false)
      // Reload templates after creating a new one
      listTemplates().then(setTemplates).catch(console.error)
    },
    [listTemplates],
  )

  const handleManageTemplates = useCallback(() => {
    setIsManageTemplatesDialogOpen(true)
  }, [])

  const handleCloseManageTemplatesDialog = useCallback(() => {
    setIsManageTemplatesDialogOpen(false)
    // Reload templates after managing them
    listTemplates().then(setTemplates).catch(console.error)
  }, [listTemplates])

  const handleSelectTemplate = useCallback(
    (template: ReleaseTemplateDocument) => {
      onUseTemplate?.(template)
      // Refresh templates after selection to show updated usage counts
      listTemplates().then(setTemplates).catch(console.error)
    },
    [onUseTemplate, listTemplates],
  )

  // DEBUG: Delete all templates - REMOVE THIS BEFORE PRODUCTION
  const handleDeleteAllTemplates = useCallback(async () => {
    try {
      await Promise.all(templates.map((template) => removeTemplate(template._id)))
      // Refresh the list
      listTemplates().then(setTemplates).catch(console.error)
    } catch (err) {
      console.error('DEBUG: Failed to delete templates:', err)
    }
  }, [templates, removeTemplate, listTemplates])

  const menuButton = (
    <Button
      icon={ChevronDownIcon}
      mode="default"
      disabled={disabled}
      tooltipProps={{
        content: t('template.tooltip'),
        disabled: disabled,
      }}
    />
  )

  const menu = (
    <Menu>
      {templates.length > 0 ? (
        templates.map((template) => (
          <MenuItem
            key={template._id}
            icon={CopyIcon}
            text={template.title}
            onClick={() => handleSelectTemplate(template)}
            disabled={disabled}
          />
        ))
      ) : (
        <Flex justify="center" padding={3}>
          <Text size={1} muted>
            {t('template.no-templates-available', {fallback: 'No templates available'})}
          </Text>
        </Flex>
      )}
      <MenuDivider />
      <MenuItem
        icon={TiersIcon}
        text={t('template.create')}
        onClick={handleCreateTemplate}
        disabled={disabled}
      />
      <MenuItem
        icon={CogIcon}
        text={t('template.manage')}
        onClick={handleManageTemplates}
        disabled={disabled || templates.length === 0}
      />
      {/* DEBUG ONLY - REMOVE BEFORE PRODUCTION */}
      {templates.length > 0 && (
        <>
          <MenuDivider />
          <MenuItem
            icon={TrashIcon}
            text={t('template.debug-delete-all', {fallback: 'Delete All'})}
            onClick={handleDeleteAllTemplates}
            disabled={disabled}
            tone="critical"
          />
        </>
      )}
    </Menu>
  )

  return (
    <>
      <ButtonGroup align="center">
        {children}
        <MenuButton
          button={menuButton}
          id="release-template-menu"
          menu={menu}
          popover={{
            placement: 'bottom-end',
            portal: true,
            constrainSize: true,
          }}
        />
      </ButtonGroup>
      {isCreateTemplateDialogOpen && (
        <CreateTemplateDialog
          onCancel={handleCloseTemplateDialog}
          onSubmit={handleSubmitTemplate}
        />
      )}
      {isManageTemplatesDialogOpen && (
        <ManageTemplatesDialog onClose={handleCloseManageTemplatesDialog} />
      )}
    </>
  )
}
