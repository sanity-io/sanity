import {Card, Stack, Text} from '@sanity/ui'

/**
 * Stand-in for a full-screen or modal surface when it is rendered on a docs page.
 *
 * A docs page renders EVERY story of a component into one document. A surface that portals a
 * full-viewport overlay to `document.body` is a modal in canvas view and a page-killer in docs
 * view: the overlays stack until the prose is invisible, and each `react-focus-lock` fights the
 * others for the active element until the page stops responding. That is upstream findings ledger
 * #50, found the first time by a human whose browser locked up on the Search Popover docs page.
 *
 * The fix is to render this instead when `viewMode === 'docs'`, leaving the surface itself one
 * click away in the canvas where it has the whole viewport to itself. The prose is unaffected,
 * which is the point: a docs page is where you read about the states, not where you operate a
 * dozen of them at once.
 *
 * ```tsx
 * render: (args, {viewMode, id, name}) =>
 *   viewMode === 'docs' ? <OverlayStoryNotice title={name} storyId={id} /> : <TheSurface />
 * ```
 *
 * Lives here rather than in `searchHarness` because it is not a search concern. Search needed it
 * first; `NotAuthenticatedScreen` (a `Dialog`) was the second, found by the docs gate rather than
 * by a person, which is the gate working as intended.
 */
export function OverlayStoryNotice({
  title,
  storyId,
}: {
  title: string
  /** Canvas link target, e.g. `search-search-popover--with-results`. */
  storyId: string
}) {
  return (
    <Card padding={4} radius={2} border tone="transparent">
      <Stack gap={3}>
        <Text size={1} weight="medium">
          {title}
        </Text>
        <Text muted size={1}>
          This surface takes over the whole viewport, so it is not rendered inline here: a docs page
          shows every story at once, and a stack of full-screen overlays would bury the page you are
          reading.
        </Text>
        <Text size={1}>
          <a href={`?path=/story/${storyId}`}>Open it in the canvas</a>
        </Text>
      </Stack>
    </Card>
  )
}
