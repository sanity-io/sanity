/* oxlint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import {type Schema} from '@sanity/types'
import {Card, Heading, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useToast} from '@sanity/ui/toast'
import {useEffect} from 'react'
import {Container, Flex, Grid, VStack} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {type SchemaErrorContext} from '../../../config/SchemaError'
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
  const [, copy] = useCopyToClipboard()
  const handleCopyToClipboard = async () => {
    const errorsText = formatSchemaErrorsToMarkdown(groupsWithErrors, context)

    try {
      const ok = await copy(errorsText)
      if (ok) {
        toast.push({status: 'success', title: 'Copied to clipboard'})
      } else {
        toast.push({status: 'error', title: 'Clipboard not supported'})
      }
    } catch {
      toast.push({status: 'error', title: 'Clipboard not supported'})
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
            <Heading as="h1">Schema errors</Heading>
            <Button text="Copy to clipboard" onClick={handleCopyToClipboard} />
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
                  Error location
                </Text>
                <Grid gap={2} gridTemplateColumns="max-content auto">
                  <ContextRow label="Workspace" value={context.workspaceName} />
                  {context.sourceName && <ContextRow label="Source" value={context.sourceName} />}
                  <ContextRow label="Project ID" value={context.projectId} />
                  <ContextRow label="Dataset" value={context.dataset} />
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
