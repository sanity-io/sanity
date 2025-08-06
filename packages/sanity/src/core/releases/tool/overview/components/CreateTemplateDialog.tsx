import {Box, Card, Flex, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'

import {Button, Dialog} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {getReleaseDefaults} from '../../../util/util'
import {useReleaseTemplateOperations} from '../templates'
import {TemplateForm, type TemplateFormData} from './TemplateForm'

interface CreateTemplateDialogProps {
  onCancel: () => void
  onSubmit: (templateId: string) => void
}

export function CreateTemplateDialog(props: CreateTemplateDialogProps): React.JSX.Element {
  const {onCancel, onSubmit} = props
  const toast = useToast()
  const {t} = useTranslation(releasesLocaleNamespace)
  const {create: createTemplate} = useReleaseTemplateOperations()

  const [template, setTemplate] = useState<TemplateFormData>(() => ({
    ...getReleaseDefaults(),
    selectedDocumentTypes: [],
  }))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOnSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!template.metadata?.title) {
        toast.push({
          closable: true,
          status: 'error',
          title: t('template.validation.title-required'),
        })
        return
      }

      setIsSubmitting(true)

      try {
        const newTemplate = await createTemplate({
          title: template.metadata.title,
          description: template.metadata.description,
          selectedDocumentTypes: template.selectedDocumentTypes || [],
        })

        toast.push({
          closable: true,
          status: 'success',
          title: t('template.toast.create-success.title'),
          description: t('template.toast.create-success.description', {
            templateName: newTemplate.title,
          }),
        })

        onSubmit(newTemplate._id)
      } catch (err) {
        console.error(err)
        toast.push({
          closable: true,
          status: 'error',
          title: t('template.toast.create-error.title'),
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [onSubmit, toast, t, template, createTemplate],
  )

  const handleOnChange = useCallback((templateMetadata: TemplateFormData) => {
    setTemplate(templateMetadata)
  }, [])

  const dialogTitle = t('template.dialog.create.title')
  const dialogConfirm = t('template.dialog.create.confirm')

  return (
    <Dialog
      onClickOutside={onCancel}
      header={dialogTitle}
      id="create-template-dialog"
      onClose={onCancel}
      width={1}
      padding={false}
    >
      <Card padding={4} borderTop>
        <form onSubmit={handleOnSubmit}>
          <Box paddingBottom={4}>
            <TemplateForm onChange={handleOnChange} value={template} />
          </Box>
          <Flex justify="flex-end" paddingTop={5}>
            <Button
              size="large"
              disabled={isSubmitting}
              type="submit"
              text={dialogConfirm}
              loading={isSubmitting}
              data-testid="submit-template-button"
            />
          </Flex>
        </form>
      </Card>
    </Dialog>
  )
}
