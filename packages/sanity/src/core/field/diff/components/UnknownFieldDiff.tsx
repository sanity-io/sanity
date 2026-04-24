import {Box, Card, Code, Stack, Text} from '@sanity/ui'

import {type Diff, type DiffComponent} from '../../types'

/**
 * Renders a JSON diff for a field that exists in the document history but not in the
 * current schema. Intentionally minimal: we can't produce a schema-aware, semantic diff,
 * so we fall back to showing the raw JSON before/after values so the change is at least
 * visible.
 *
 * This is rendered for every field that the schema-driven change-list walker (in
 * `buildChangeList.ts`) can't match to a schema field. See `buildUnknownFieldChanges`.
 *
 * @internal
 */
export const UnknownFieldDiff: DiffComponent<Diff> = ({diff}) => {
  const from = formatJson(diff.fromValue)
  const to = formatJson(diff.toValue)

  return (
    <Stack space={2}>
      <Text size={1} muted>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        Field not in schema — showing JSON diff
      </Text>
      <Stack space={1}>
        {diff.fromValue !== undefined && (
          <Card padding={3} radius={2} tone="critical">
            <Box overflow="auto">
              <Code size={1} language="json">
                {from}
              </Code>
            </Box>
          </Card>
        )}
        {diff.toValue !== undefined && (
          <Card padding={3} radius={2} tone="positive">
            <Box overflow="auto">
              <Code size={1} language="json">
                {to}
              </Code>
            </Box>
          </Card>
        )}
      </Stack>
    </Stack>
  )
}

function formatJson(value: unknown): string {
  if (value === undefined) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
