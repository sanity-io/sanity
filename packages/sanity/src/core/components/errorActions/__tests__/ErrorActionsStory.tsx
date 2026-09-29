import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {ErrorActions} from '../ErrorActions'

const FIXTURE_ERROR = new Error('network failed')

const NOOP = () => undefined

/**
 * Chromatic sentinel for the shared error-boundary action row. Retry and
 * copy still sit in an `@sanity/ui` Inline next to ui-components Button
 * tones — a mix TypeScript will not catch if Inline gap or button loading
 * chrome drifts during the ui5 migration. Copy is hardcoded (ErrorActions
 * renders outside LocaleProvider). No toast, no clipboard.
 */
export function ErrorActionsStory() {
  return (
    <Card padding={4} style={{maxWidth: 480}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            copy only
          </Text>
          <ErrorActions error={FIXTURE_ERROR} eventId="evt_fixture" />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            retry and copy
          </Text>
          <ErrorActions error={FIXTURE_ERROR} eventId="evt_fixture" onRetry={NOOP} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            retrying
          </Text>
          <ErrorActions error={FIXTURE_ERROR} eventId="evt_fixture" isRetrying onRetry={NOOP} />
        </VStack>
      </VStack>
    </Card>
  )
}
