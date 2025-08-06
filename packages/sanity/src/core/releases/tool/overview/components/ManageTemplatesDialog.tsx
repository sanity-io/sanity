import {ChevronDownIcon, TrashIcon} from '@sanity/icons'
import {
  Card,
  Flex,
  MenuDivider,
  Spinner,
  Stack,
  Text,
  useClickOutsideEvent,
  useToast,
} from '@sanity/ui'
import {type FormEvent, useCallback, useEffect, useRef, useState} from 'react'

import {Button, Dialog, Popover} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {useReleaseTemplateOperations} from '../templates'
import {type ReleaseTemplateDocument} from '../templates/types'
import {TemplateForm, type TemplateFormData} from './TemplateForm'

interface ManageTemplatesDialogProps {
  onClose: () => void
}

export function ManageTemplatesDialog(props: ManageTemplatesDialogProps): React.JSX.Element {
  const {onClose} = props
  const toast = useToast()
  const {t} = useTranslation(releasesLocaleNamespace)
  const {
    list: listTemplates,
    update: updateTemplate,
    remove: removeTemplate,
  } = useReleaseTemplateOperations()

  const [templates, setTemplates] = useState<ReleaseTemplateDocument[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReleaseTemplateDocument | null>(null)
  const [templateFormData, setTemplateFormData] = useState<TemplateFormData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const popoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true)
        const templateList = await listTemplates()
        setTemplates(templateList)

        // Auto-select the first template if available
        if (templateList.length > 0) {
          const firstTemplate = templateList[0]
          setSelectedTemplate(firstTemplate)
          setTemplateFormData({
            _id: firstTemplate._id,
            metadata: {
              title: firstTemplate.title,
              description: firstTemplate.description,
            },
            selectedDocumentTypes: firstTemplate.selectedDocumentTypes,
          })
        }
      } catch (err) {
        console.error('Failed to load templates:', err)
        toast.push({
          closable: true,
          status: 'error',
          title: t('template.toast.fetch-error.title'),
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplates()
  }, [listTemplates, toast, t])

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false)
  }, [])

  useClickOutsideEvent(closeDropdown, () => [popoverRef.current])

  const handleTemplateSelect = useCallback((template: ReleaseTemplateDocument) => {
    setSelectedTemplate(template)
    setTemplateFormData({
      _id: template._id,
      metadata: {
        title: template.title,
        description: template.description,
      },
      selectedDocumentTypes: template.selectedDocumentTypes,
    })
    setIsDropdownOpen(false)
  }, [])

  const handleFormChange = useCallback((formData: TemplateFormData) => {
    setTemplateFormData(formData)
  }, [])

  const handleDropdownClick = useCallback(() => {
    setIsDropdownOpen(!isDropdownOpen)
  }, [isDropdownOpen])

  const handleSave = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!selectedTemplate || !templateFormData) return

      if (!templateFormData.metadata?.title) {
        toast.push({
          closable: true,
          status: 'error',
          title: t('template.validation.title-required'),
        })
        return
      }

      setIsSaving(true)

      try {
        const updatedTemplate = await updateTemplate({
          _id: selectedTemplate._id,
          title: templateFormData.metadata.title,
          description: templateFormData.metadata.description,
          selectedDocumentTypes: templateFormData.selectedDocumentTypes || [],
        })

        toast.push({
          closable: true,
          status: 'success',
          title: t('template.toast.update-success.title'),
          description: t('template.toast.update-success.description', {
            templateName: updatedTemplate.title,
          }),
        })

        // Refresh templates list and update selected template
        const templateList = await listTemplates()
        setTemplates(templateList)
        const refreshedTemplate = templateList.find(
          (template) => template._id === selectedTemplate._id,
        )
        if (refreshedTemplate) {
          setSelectedTemplate(refreshedTemplate)
          setTemplateFormData({
            _id: refreshedTemplate._id,
            metadata: {
              title: refreshedTemplate.title,
              description: refreshedTemplate.description,
            },
            selectedDocumentTypes: refreshedTemplate.selectedDocumentTypes,
          })
        }
      } catch (err) {
        console.error('Failed to update template:', err)
        toast.push({
          closable: true,
          status: 'error',
          title: t('template.toast.update-error.title'),
        })
      } finally {
        setIsSaving(false)
      }
    },
    [selectedTemplate, templateFormData, updateTemplate, toast, t, listTemplates],
  )

  const handleDeleteTemplate = useCallback(async () => {
    if (!selectedTemplate) {
      return
    }

    setIsDeleting(true)
    try {
      await removeTemplate(selectedTemplate._id)

      toast.push({
        closable: true,
        status: 'success',
        title: t('template.toast.remove-success.title'),
        description: t('template.toast.remove-success.description', {
          templateName: selectedTemplate.title,
        }),
      })

      // Refresh templates list and auto-select first template or clear selection
      const templateList = await listTemplates()
      setTemplates(templateList)

      if (templateList.length > 0) {
        const firstTemplate = templateList[0]
        setSelectedTemplate(firstTemplate)
        setTemplateFormData({
          _id: firstTemplate._id,
          metadata: {
            title: firstTemplate.title,
            description: firstTemplate.description,
          },
          selectedDocumentTypes: firstTemplate.selectedDocumentTypes,
        })
      } else {
        // No templates left, clean up state and close the manage dialog
        setSelectedTemplate(null)
        setTemplateFormData(null)
        // Use setTimeout to ensure state updates complete before closing
        setTimeout(() => {
          onClose()
        }, 0)
      }
    } catch (err) {
      console.error('Failed to delete template:', err)
      toast.push({
        closable: true,
        status: 'error',
        title: t('template.toast.remove-error.title'),
      })
    } finally {
      setIsDeleting(false)
    }
  }, [selectedTemplate, removeTemplate, toast, t, listTemplates, onClose])

  if (isLoading) {
    return (
      <Dialog
        onClickOutside={onClose}
        header={t('template.dialog.manage.title')}
        id="manage-templates-dialog"
        onClose={onClose}
        width={1}
        padding={false}
      >
        <Card padding={6} borderTop>
          <Flex justify="center" align="center" gap={3}>
            <Spinner size={2} />
            <Text>{t('template.loading')}</Text>
          </Flex>
        </Card>
      </Dialog>
    )
  }

  if (templates.length === 0) {
    return (
      <Dialog
        onClickOutside={onClose}
        header={t('template.dialog.manage.title')}
        id="manage-templates-dialog"
        onClose={onClose}
        width={1}
        padding={false}
      >
        <Card padding={6} borderTop>
          <Flex justify="center" align="center">
            <Text muted>{t('template.no-templates')}</Text>
          </Flex>
        </Card>
      </Dialog>
    )
  }

  const DropdownContent = () => {
    return (
      <Stack space={1}>
        {templates.map((template) => (
          <Card
            key={template._id}
            padding={2}
            radius={1}
            tone={selectedTemplate?._id === template._id ? 'primary' : 'default'}
            style={{cursor: 'pointer'}}
            onClick={() => handleTemplateSelect(template)}
          >
            <Stack space={1}>
              <Text
                size={1}
                weight={selectedTemplate?._id === template._id ? 'semibold' : 'regular'}
              >
                {template.title}
              </Text>
              {template.description && (
                <Text size={0} muted>
                  {template.description}
                </Text>
              )}
            </Stack>
          </Card>
        ))}
      </Stack>
    )
  }

  return (
    <>
      <Dialog
        onClickOutside={onClose}
        header={t('template.dialog.manage.title')}
        id="manage-templates-dialog"
        onClose={onClose}
        width={1}
        padding={false}
      >
        <Card padding={4} borderTop>
          <Stack space={6}>
            {/* Template Selector Dropdown - always visible */}
            <Stack space={3}>
              <Text size={2} weight="semibold">
                {t('template.form.title')}
              </Text>

              <Popover
                content={<DropdownContent />}
                open={isDropdownOpen}
                padding={1}
                placement="bottom-start"
                ref={popoverRef}
                constrainSize
                portal
                fallbackPlacements={['bottom-start', 'top-start']}
              >
                <Card
                  tone="default"
                  border
                  radius={2}
                  padding={3}
                  style={{cursor: 'pointer'}}
                  onClick={handleDropdownClick}
                >
                  <Flex align="center" justify="space-between">
                    <Text size={1} weight="regular">
                      {selectedTemplate?.title || t('template.dialog.manage.select-placeholder')}
                    </Text>
                    <Flex
                      align="center"
                      justify="center"
                      style={{
                        transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <ChevronDownIcon />
                    </Flex>
                  </Flex>
                </Card>
              </Popover>
            </Stack>

            {/* Template Edit Form - always shown since we auto-select first template */}
            {selectedTemplate && templateFormData && (
              <form onSubmit={handleSave}>
                <Stack space={5}>
                  <TemplateForm onChange={handleFormChange} value={templateFormData} />

                  <MenuDivider />

                  <Flex justify="space-between" align="center">
                    <Button
                      icon={TrashIcon}
                      text={t('template.dialog.manage.delete')}
                      tone="critical"
                      mode="ghost"
                      type="button"
                      onClick={handleDeleteTemplate}
                      disabled={isSaving || isDeleting}
                    />

                    <Button
                      size="large"
                      disabled={isSaving || isDeleting}
                      type="submit"
                      text={t('template.dialog.manage.save')}
                      loading={isSaving}
                      data-testid="save-template-button"
                    />
                  </Flex>
                </Stack>
              </form>
            )}
          </Stack>
        </Card>
      </Dialog>
    </>
  )
}
