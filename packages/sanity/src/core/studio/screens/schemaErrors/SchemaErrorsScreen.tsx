import {type Schema} from '@sanity/types'
import {Card, Code, Container, Flex, Heading, Stack, Text, useToast} from '@sanity/ui'
import {useEffect} from 'react'

import {Button} from '../../../../ui-components'
import {type SchemaErrorContext} from '../../../config/SchemaError'
import {useTranslation} from '../../../i18n'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {formatSchemaErrorsToMarkdown} from './formatSchemaErrorsToMarkdown'
import {reportWarnings} from './reportWarnings'
import {SchemaProblemGroups} from './SchemaProblemGroups'

interface SchemaErrorsScreenProps {
  schema: Schema
  /** Optional context about which source/workspace has the schema error */
  context?: SchemaErrorContext
}

export function SchemaErrorsScreen({schema, context}: SchemaErrorsScreenProps) {
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
    let errorsText = formatSchemaErrorsToMarkdown(groupsWithErrors)

    // Include context information in the copied text
    if (context) {
      const contextText = `## Source Information\n\n- **Source:** ${context.sourceName}\n- **Project ID:** ${context.projectId}\n- **Dataset:** ${context.dataset}\n\n`
      errorsText = contextText + errorsText
    }

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
        <Stack space={5}>
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
          {context && (
            <Card padding={4} radius={2} shadow={1} tone="caution">
              <Stack space={3}>
                <Text weight="semibold">
                  {t('schema-errors.source-info.title', 'Error location')}
                </Text>
                <Stack space={2}>
                  <Text size={1}>
                    <strong>{t('schema-errors.source-info.source', 'Source:')}</strong>{' '}
                    <Code size={1}>{context.sourceName}</Code>
                  </Text>
                  <Text size={1}>
                    <strong>{t('schema-errors.source-info.project', 'Project:')}</strong>{' '}
                    <Code size={1}>{context.projectId}</Code>
                  </Text>
                  <Text size={1}>
                    <strong>{t('schema-errors.source-info.dataset', 'Dataset:')}</strong>{' '}
                    <Code size={1}>{context.dataset}</Code>
                  </Text>
                </Stack>
              </Stack>
            </Card>
          )}
          <SchemaProblemGroups problemGroups={groupsWithErrors} />
        </Stack>
      </Container>
    </Card>
  )
}
