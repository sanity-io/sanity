import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'

import {PREVIEW_VALUES, TOAST_EVENTS, type ToastEvent, toastCopy, type ToastValues} from './events'
import {useResultToast} from './ResultToast'

// The Design options entry for the result toasts: one row per event with its copy, tone, action and duration, and a button
// that shows the toast. These are the same toasts the real create, delete and publish flows push.
// Definition created and definition deleted have no flow in this test studio (definitions are made in the stock Variants tool),
// so for those two the preview is the only way to see the toast.

const PREVIEW_ONLY = new Set(['definition-created', 'definition-deleted'])
const TONE_DOT: Record<ToastEvent['tone'], string> = {
  positive: 'var(--card-badge-positive-dot-color)',
  caution: 'var(--card-badge-caution-dot-color)',
  critical: 'var(--card-badge-critical-dot-color)',
  neutral: 'var(--card-badge-default-dot-color)',
}

/** The drawn examples: one version deleted or published, twelve created. */
const EXAMPLE: Partial<Record<ToastEvent['id'], Partial<ToastValues>>> = {'version-deleted': {count: 1}, published: {count: 1}}

const durationText = (ms: number) => (Number.isFinite(ms) ? `${ms / 1000} s` : 'until dismissed')

export function ToastPreviews() {
  const show = useResultToast()
  return (
    <Stack data-testid="toast-previews" gap={3}>
      <Stack gap={1}>
        <Text size={2} weight="medium">
          Result toasts
        </Text>
        <Text muted size={0}>
          The stock Studio toast, one at a time. Pick Button or Link in Look to change how the action shows. Click a row to show its toast.
        </Text>
      </Stack>
      <Stack gap={2}>
        {TOAST_EVENTS.map((event) => {
          const copy = toastCopy(event.id, {...PREVIEW_VALUES, ...EXAMPLE[event.id]})
          return (
            <Card border key={event.id} padding={3} radius={3} style={{background: 'var(--card-bg-color)'}}>
              <Flex align="center" gap={3}>
                <span aria-hidden="true" style={{background: TONE_DOT[event.tone], borderRadius: 9999, flexShrink: 0, height: 8, width: 8}} />
                <Box flex={1}>
                  <Stack gap={1}>
                    <Text size={1} weight="medium">
                      {event.label}
                    </Text>
                    <Text muted size={0}>
                      {copy.title}
                      {copy.description ? ` · ${copy.description}` : ''}
                    </Text>
                    <Text muted size={0}>
                      {event.tone} · {event.action ? `action: ${event.action}` : 'no action'} · {durationText(event.duration)}
                      {PREVIEW_ONLY.has(event.id) ? ' · preview only: no flow in this studio' : ''}
                    </Text>
                  </Stack>
                </Box>
                <Button
                  data-testid={`toast-preview-${event.id}`}
                  fontSize={1}
                  mode="ghost"
                  onClick={() => show(event.id, EXAMPLE[event.id])}
                  padding={2}
                  style={{height: 31}}
                  text="Show"
                />
              </Flex>
            </Card>
          )
        })}
      </Stack>
    </Stack>
  )
}
