import {type Schema} from '@sanity/types'
import {Card, Heading, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useToast} from '@sanity/ui/toast'
import {useEffect} from 'react'
import {Container, Flex, Grid, VStack} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {type SchemaErrorContext} from '../../../config/SchemaError'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {formatSchemaErrorsToMarkdown} from './formatSchemaErrorsToMarkdown'
import {reportWarnings} from './reportWarnings'
import {SchemaProblemGroups} from './SchemaProblemGroups'

interface SchemaErrorsScreenProps {
  schema: Schema
  /** Which workspace and source the schema belongs to, when the thrower knew it */
  context?: SchemaErrorContext
}

function ContextRow(props: {label: string; value: string}) {
  return (
    <>
      <Text size={1} weight="medium">
        {props.label}
      </Text>
      <Code size={1}>{props.value}</Code>
    </>
  )
}

export function SchemaErrorsScreen({schema, context}: SchemaErrorsScreenProps) {
  const groupsWithErrors =
    schema._validation?.filter((group) =>
      group.problems.some((problem) => problem.severity === 'error'),
    ) || []

  useEffect(() => reportWarnings(schema), [schema])

  const toast = useToast()
  // Every call carries an inline default: prepareConfig throws above LocaleProvider,
  // so on that path there is no translator and a bare key would reach the screen.
  const {t} = useTranslation('studio')
  const {t: tCopyPaste} = useTranslation('copy-paste')
  const [, copy] = useCopyToClipboard()
  const handleCopyToClipboard = async () => {
    const errorsText = formatSchemaErrorsToMarkdown(groupsWithErrors, context)

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
    <Card
      data-testid="studio-error-screen"
      data-error="Schema errors"
      height="fill"
      overflow="auto"
      paddingY={[4, 5, 6, 7]}
      paddingX={4}
      sizing="border"
    >
      <Container size={1}>
        <VStack gap={5}>
          <Flex justifyContent="space-between" alignItems="center" gap={2}>
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
            <Card
              border
              padding={4}
              radius={2}
              tone="transparent"
              data-testid="schema-error-location"
            >
              <VStack gap={3}>
                <Text size={1} weight="medium">
                  {t('schema-errors.location.title', 'Error location')}
                </Text>
                <Grid gap={2} gridTemplateColumns="max-content auto">
                  <ContextRow
                    label={t('schema-errors.location.workspace', 'Workspace')}
                    value={context.workspaceName}
                  />
                  {context.sourceName && (
                    <ContextRow
                      label={t('schema-errors.location.source', 'Source')}
                      value={context.sourceName}
                    />
                  )}
                  <ContextRow
                    label={t('schema-errors.location.project-id', 'Project ID')}
                    value={context.projectId}
                  />
                  <ContextRow
                    label={t('schema-errors.location.dataset', 'Dataset')}
                    value={context.dataset}
                  />
                </Grid>
              </VStack>
            </Card>
          )}
          <SchemaProblemGroups problemGroups={groupsWithErrors} />
        </VStack>
      </Container>
    </Card>
  )
}
