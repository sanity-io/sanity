import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {ErrorCard} from '../ErrorCard'

const FRAME_STYLE = {height: 200, position: 'relative' as const}
const MESSAGE = 'Preview iframe failed to load.'
const NOOP = () => undefined

/**
 * Chromatic sentinel for Presentation preview-error chrome after the ui5 Box
 * migration. Retry / continue-anyway / both action rows pair Box wrapping
 * with ghost and critical button tones — a mix TypeScript will not catch.
 * Message is a fixture (no live iframe, no timestamps).
 */
export function ErrorCardStory() {
  return (
    <TestWrapper i18nBundles={[presentationUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              message only
            </Text>
            <div style={FRAME_STYLE}>
              <ErrorCard message={MESSAGE} />
            </div>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              retry
            </Text>
            <div style={FRAME_STYLE}>
              <ErrorCard message={MESSAGE} onRetry={NOOP} />
            </div>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              continue anyway
            </Text>
            <div style={FRAME_STYLE}>
              <ErrorCard message={MESSAGE} onContinueAnyway={NOOP} />
            </div>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              retry and continue
            </Text>
            <div style={FRAME_STYLE}>
              <ErrorCard message={MESSAGE} onContinueAnyway={NOOP} onRetry={NOOP} />
            </div>
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
