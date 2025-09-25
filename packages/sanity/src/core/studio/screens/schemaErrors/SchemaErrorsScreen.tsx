import {type Schema} from '@sanity/types'
import {Card, Container, Flex, Heading, Stack, useToast} from '@sanity/ui'
import {useEffect} from 'react'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {formatSchemaErrorsToMarkdown} from './formatSchemaErrorsToMarkdown'
import {reportWarnings} from './reportWarnings'
import {SchemaProblemGroups} from './SchemaProblemGroups'

interface SchemaErrorsScreenProps {
  schema: Schema
}

export function SchemaErrorsScreen({schema}: SchemaErrorsScreenProps) {
  const groupsWithErrors =
    schema._validation?.filter((group) =>
      group.problems.some((problem) => problem.severity === 'error'),
    ) || []

  useEffect(() => reportWarnings(schema), [schema])

  const toast = useToast()
  const {t} = useTranslation('studio')
  const {t: tCopyPaste} = useTranslation('copy-paste')
  const [, copy] = useCopyToClipboard()
  const handleCopyToClipboard = async () => {
    const errorsText = formatSchemaErrorsToMarkdown(groupsWithErrors)

    try {
      const ok = await copy(errorsText)
      if (ok) {
        toast.push({
          status: 'success',
          title: t(
            'about-dialog.version-info.copy-to-clipboard-button.copied-text',
            'Copied to clipboard',
          ),
        })
      } else {
        toast.push({
          status: 'error',
          title: tCopyPaste(
            'copy-paste.on-copy.validation.clipboard-not-supported.title',
            'Clipboard not supported',
          ),
        })
      }
    } catch {
      toast.push({
        status: 'error',
        title: tCopyPaste(
          'copy-paste.on-copy.validation.clipboard-not-supported.title',
          'Clipboard not supported',
        ),
      })
    }
  }

  return (
    <Card height="fill" overflow="auto" paddingY={[4, 5, 6, 7]} paddingX={4} sizing="border">
      <Container width={1}>
        <Stack gap={5}>
          <Flex justify="space-between" align="center" gap={2}>
            <Heading as="h1">{t('schema-errors.title', 'Schema errors')}</Heading>
            <Button
              text={t(
                'about-dialog.version-info.copy-to-clipboard-button.text',
                'Copy to clipboard',
              )}
              onClick={handleCopyToClipboard}
            />
          </Flex>
          <SchemaProblemGroups problemGroups={groupsWithErrors} />
        </Stack>
      </Container>
    </Card>
  )
}
