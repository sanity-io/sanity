/* eslint-disable i18next/no-literal-string */
import {type Schema} from '@sanity/types'
import {Card, Container, Heading, Stack} from '@sanity/ui'
import {useEffect} from 'react'

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

  return (
    <Card height="fill" overflow="auto" paddingY={[4, 5, 6, 7]} paddingX={4} sizing="border">
      <Container width={1}>
        <Stack space={5}>
          <Heading as="h1">Schema errors</Heading>
          <SchemaProblemGroups problemGroups={groupsWithErrors} />
        </Stack>
      </Container>
    </Card>
  )
}
