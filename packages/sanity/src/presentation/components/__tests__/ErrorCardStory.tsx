import {Card, Label, Stack, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {ErrorCard} from '../ErrorCard'

const FRAME_STYLE = {height: 200}
const MESSAGE = 'Preview iframe failed to load.'

// The editor DocumentPane / DocumentListPane fill the children slot with a
// dev-mode critical card between the message and the action row.
const DEV_DETAILS = (
  <Card padding={3} radius={2} tone="critical">
    <Stack gap={3}>
      <Label muted size={0}>
        Error details
      </Label>
      <Code size={1}>Cannot read properties of undefined (reading &apos;_id&apos;)</Code>
    </Stack>
  </Card>
)

/**
 * Chromatic sentinel for Presentation preview-error chrome after the ui5 Box
 * migration. Retry / continue-anyway / both action rows pair Box wrapping
 * with ghost and critical button tones — a mix TypeScript will not catch —
 * and the children slot shows the Stack gap around a dev-mode details card.
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
              <ErrorCard message={MESSAGE} onRetry={noop} />
            </div>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              continue anyway
            </Text>
            <div style={FRAME_STYLE}>
              <ErrorCard message={MESSAGE} onContinueAnyway={noop} />
            </div>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              retry and continue
            </Text>
            <div style={FRAME_STYLE}>
              <ErrorCard message={MESSAGE} onContinueAnyway={noop} onRetry={noop} />
            </div>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              retry with dev-mode details (editor panes)
            </Text>
            <div style={{height: 280}}>
              <ErrorCard message={MESSAGE} onRetry={noop}>
                {DEV_DETAILS}
              </ErrorCard>
            </div>
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
