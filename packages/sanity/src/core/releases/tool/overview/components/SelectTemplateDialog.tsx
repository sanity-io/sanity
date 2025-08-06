import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {Button, Dialog} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {useReleaseTemplateOperations} from '../templates'
import {type ReleaseTemplateDocument} from '../templates/types'

interface SelectTemplateDialogProps {
  onCancel: () => void
  onSelect: (template: ReleaseTemplateDocument) => void
}

export function SelectTemplateDialog(props: SelectTemplateDialogProps): React.JSX.Element {
  const {onCancel, onSelect} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {list: listTemplates} = useReleaseTemplateOperations()

  const [templates, setTemplates] = useState<ReleaseTemplateDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateList = await listTemplates()
        setTemplates(templateList)
      } catch (err) {
        console.error('Failed to load templates:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplates()
  }, [listTemplates])

  const handleSelectTemplate = useCallback(
    (template: ReleaseTemplateDocument) => {
      onSelect(template)
    },
    [onSelect],
  )

  return (
    <Dialog
      header={t('template.use-dialog.title')}
      id="use-template-dialog"
      onClose={onCancel}
      width={1}
    >
      <Box padding={4}>
        {isLoading ? (
          <Text>{t('template.use-dialog.loading')}</Text>
        ) : templates.length === 0 ? (
          <Text>{t('template.use-dialog.no-templates')}</Text>
        ) : (
          <Stack space={3}>
            <Text size={1} muted>
              {t('template.use-dialog.description')}
            </Text>
            <Stack space={2}>
              {templates.map((template) => (
                <Card
                  key={template._id}
                  padding={3}
                  radius={2}
                  shadow={1}
                  tone="default"
                  style={{cursor: 'pointer'}}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <Stack space={2}>
                    <Text weight="semibold">{template.title}</Text>
                    {template.description && (
                      <Text size={1} muted>
                        {template.description}
                      </Text>
                    )}
                    <Text size={1} muted>
                      {t('template.use-dialog.document-types', {
                        count: template.selectedDocumentTypes.length,
                      })}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Stack>
        )}
        <Flex justify="flex-end" paddingTop={4}>
          <Button mode="default" onClick={onCancel} tooltipProps={null}>
            {t('general.cancel')}
          </Button>
        </Flex>
      </Box>
    </Dialog>
  )
}
