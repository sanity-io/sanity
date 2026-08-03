import {Box, Card, Flex, Inline, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {expect, userEvent, within} from 'storybook/test'

// Real components from real source (org contract §8): the twelve exported Vision pieces
// that had no story of their own, a spinner, a popover, the run/listen controls, the
// label/link chrome around the CodeMirror panes, and the result-footer scaffolding (the
// styled wrappers `VisionGui.styled.tsx` exports around the tree, timings and save buttons).
// Every one of these already renders somewhere in the six sibling pages
// (QueryEditor / ParamsEditor / Controls / ResultTree / Errors / SavedQueries), just never
// as its own subject with its own state matrix. This page is that companion, not a repeat
// of what those pages already show.
import {DelayedSpinner} from '../../../../../packages/@sanity/vision/src/components/DelayedSpinner'
import {PerspectivePopover} from '../../../../../packages/@sanity/vision/src/components/PerspectivePopover'
import {QueryErrorDialog} from '../../../../../packages/@sanity/vision/src/components/QueryErrorDialog'
import {ResultView} from '../../../../../packages/@sanity/vision/src/components/ResultView'
import {
  SaveCsvButton,
  SaveJsonButton,
} from '../../../../../packages/@sanity/vision/src/components/SaveResultButtons'
import {
  DownloadsCard,
  InputBackgroundContainerLeft,
  QueryCopyLink,
  Result,
  SaveResultLabel,
  StyledLabel,
  TimingsCard,
} from '../../../../../packages/@sanity/vision/src/components/VisionGui.styled'
import {VisionGuiControls} from '../../../../../packages/@sanity/vision/src/components/VisionGuiControls'
import {
  getCsvBlobUrl,
  getJsonBlobUrl,
} from '../../../../../packages/@sanity/vision/src/util/getBlobUrl'
import {createMockVisionClient, visionBookResults} from '../../../lib/mockVisionClient'
import {WithStudioProviders} from '../../../lib/testProvider'
import {
  AuditNote,
  groqSyntaxError,
  VISION_DATASET,
  visionSchemaTypes,
} from '../../../lib/visionStoryKit'

const meta: Meta = {
  title: 'Lists & Data/Vision/Parts',
  parameters: {
    layout: 'fullscreen',
    controls: {include: []},
    docs: {
      description: {
        component: [
          'This page exists because the six sibling pages leave three questions implicit: does an ' +
            'empty result look different from one that never ran, does a non-tabular result explain ' +
            'why the CSV button declines, and do the two timing numbers say which is server-reported ' +
            'and which is round-trip. All three turn out to have real, source-verified answers below.',
          '',
          '| | |',
          '|---|---|',
          '| Source | twelve exported pieces across three files: seven in `VisionGui.styled.tsx` (`StyledLabel`, `QueryCopyLink`, `InputBackgroundContainerLeft`, `Result`, `TimingsCard`, `DownloadsCard`, `SaveResultLabel`), two in `SaveResultButtons.tsx` (`SaveCsvButton`, `SaveJsonButton`), one each in `DelayedSpinner.tsx`, `PerspectivePopover.tsx`, `VisionGuiControls.tsx` |',
          '| Tier | SERVICE. Scaffolding for the GROQ playground tool, not content-bearing |',
          '| Coverage | none of the twelve previously had a story of its own; each already renders inside one of the six sibling pages |',
          '',
          'None of these are unused. Where each currently appears:',
          '',
          '- `StyledLabel`, `QueryCopyLink`, `PerspectivePopover`: inside `VisionGuiHeader`, on the **Controls** page.',
          '- `Result`, `TimingsCard`, `DownloadsCard`, `SaveResultLabel`, `SaveCsvButton`, `SaveJsonButton`, `DelayedSpinner`: inside `VisionGuiResult`, on the **ResultTree** page (`StyledLabel` appears there too, on the result label).',
          '- `InputBackgroundContainerLeft`: inside the real `ParamsEditor`, on the **ParamsEditor** page. Its query-editor twin only shows up in the full `VisionGui` mount, on **In Context**; the standalone **QueryEditor** page mounts `VisionCodeMirror` directly, without this wrapper.',
          '- `VisionGuiControls`: only inside the full `VisionGui`, on **In Context**. This is its first isolated demonstration.',
          '',
          'Two are pure Box/Card wrappers with no behaviour of their own (`Result`, `TimingsCard`, `DownloadsCard`): their state comes entirely from what `VisionGuiResult` hands them as children, so this page hands them the same real children by hand to show what that decision actually produces.',
          '',
          '> **Why it matters:** isolating these parts turned up three answers the composed pages never state explicitly: not-run and empty look almost identical, CSV silently declines on a non-tabular result while JSON does not, and the two timing numbers have different sources with no label saying which is which.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: visionSchemaTypes}},
      client: createMockVisionClient(),
    }),
  ],
  tags: ['autodocs', 'chapter:data', 'source:studio-only', 'tier:service'],
}

export default meta
type Story = StoryObj

// ---------------------------------------------------------------------------------------
// DelayedSpinner: two states, both real. `show` starts false and flips true after
// `props.delay ?? 500`ms (DelayedSpinner.tsx:9-18). Before the timer fires it renders
// `null`, no placeholder, no skeleton, nothing in the DOM. VisionGuiResult mounts it only
// while `queryInProgress || (listenInProgress && no mutations yet)`, so the delay exists to
// skip the spinner entirely for a fetch that resolves fast, rather than flashing it for one
// frame.
// ---------------------------------------------------------------------------------------

/**
 * Both states of the timer side by side. The left instance uses a delay long enough that it
 * stays in its `null` return for the life of this story, an intentionally empty box, not a
 * broken one. The right instance uses `delay={0}` so it clears the timer almost immediately
 * and shows the real `<Spinner muted size={4} />` it resolves to.
 */
export const SpinnerDelay: Story = {
  name: 'DelayedSpinner (before / after the delay)',
  render: () => (
    <Card padding={4}>
      <Flex gap={4}>
        <Stack gap={2} flex={1}>
          <Text size={1} weight="medium">
            Before the delay elapses (renders null)
          </Text>
          <Card border radius={2} padding={4} style={{minHeight: 64}}>
            <DelayedSpinner delay={999999} />
          </Card>
          <Text size={1} muted>
            Nothing is in the DOM here on purpose: this is the return, not a loading gap.
          </Text>
        </Stack>
        <Stack gap={2} flex={1}>
          <Text size={1} weight="medium">
            After the delay elapses (the real return)
          </Text>
          <Card border radius={2} padding={4} style={{minHeight: 64}}>
            <DelayedSpinner delay={0} />
          </Card>
          <Text size={1} muted>
            A delay of 0 clears the timer on the first tick, so the spinner shows almost
            immediately.
          </Text>
        </Stack>
      </Flex>
    </Card>
  ),
}

// ---------------------------------------------------------------------------------------
// PerspectivePopover: one component-level return (PerspectivePopover.tsx:48-118), a
// `Popover` around a trigger `Button`, opened/closed by local `open` state. Its content is
// static except for one branch gated by `SHOW_DEFAULT_PERSPECTIVE_NOTIFICATION` (line 32),
// a module-scoped `const … = false`, not a prop, not a flag read from config. That branch
// (the amber `Dot` and the "new default" notification card, lines 73-82 and 115) is
// currently unreachable from any story, or from Studio, because nothing in the module can
// flip the constant. Not storied here for that reason: reaching it would mean reimplementing
// the markup by hand rather than exercising the real component, which is exactly what the
// org contract rules out. Worth a ledger line as dead code, not a story.
// ---------------------------------------------------------------------------------------

/** Default state: the trigger button (a `?` icon with a primary dot), popover closed. */
export const PerspectiveClosed: Story = {
  name: 'PerspectivePopover (closed)',
  render: () => (
    <Card padding={4}>
      <Inline>
        <PerspectivePopover />
      </Inline>
    </Card>
  ),
}

/**
 * The popover open: the real content, portalled to `document.body`. The docs-link Card at
 * the bottom links out to `sanity.io/docs/perspectives`.
 */
export const PerspectiveOpen: Story = {
  name: 'PerspectivePopover (open)',
  render: () => (
    <Card padding={4}>
      <Inline>
        <PerspectivePopover />
      </Inline>
    </Card>
  ),
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)
    await userEvent.click(await canvas.findByRole('button'))
    const body = within(canvasElement.ownerDocument.body)
    await expect(await body.findByText('Perspectives')).toBeInTheDocument()
  },
}

// ---------------------------------------------------------------------------------------
// VisionGuiControls: one return (VisionGuiControls.tsx:21-84), a Fetch button and a Listen
// button, each independently disabled/labelled from its own two props. Reading the disabled
// expressions closely: Fetch is `disabled={listenInProgress || !hasValidParams}`, Listen is
// `disabled={!hasValidParams}`; Listen does NOT consider `queryInProgress` at all. So while
// a fetch is in flight, the Listen button stays enabled and clickable; only starting Listen
// disables Fetch, never the other way around. Worth flagging: the two actions are not
// mutually exclusive from the button state alone, only Listen blocks Fetch.
// ---------------------------------------------------------------------------------------

/** Neither action running, params valid: both buttons enabled, no tooltip. */
export const ControlsIdle: Story = {
  name: 'VisionGuiControls (idle)',
  render: () => (
    <Card style={{maxWidth: 420}}>
      <VisionGuiControls
        hasValidParams
        queryInProgress={false}
        listenInProgress={false}
        onQueryExecution={() => {}}
        onListenExecution={() => {}}
      />
    </Card>
  ),
}

/**
 * Fetch running: it becomes "Cancel" (stop icon, positive tone) and stays clickable. Listen
 * is untouched by this prop and stays enabled, the finding above, visible directly.
 */
export const ControlsQueryInProgress: Story = {
  name: 'VisionGuiControls (query running, Listen stays enabled)',
  render: () => (
    <Stack gap={3}>
      <Card style={{maxWidth: 420}}>
        <VisionGuiControls
          hasValidParams
          queryInProgress
          listenInProgress={false}
          onQueryExecution={() => {}}
          onListenExecution={() => {}}
        />
      </Card>
      <AuditNote>
        Fetch turns into Cancel, and Listen is still enabled underneath it. The component's Listen
        button reads only its own validity flag, never whether a query is in flight: the two actions
        can both be live at once from the control surface alone.
      </AuditNote>
    </Stack>
  ),
}

/** Listen running: it becomes "Stop" (positive tone), and Fetch is disabled underneath it. */
export const ControlsListenInProgress: Story = {
  name: 'VisionGuiControls (listen running)',
  render: () => (
    <Card style={{maxWidth: 420}}>
      <VisionGuiControls
        hasValidParams
        queryInProgress={false}
        listenInProgress
        onQueryExecution={() => {}}
        onListenExecution={() => {}}
      />
    </Card>
  ),
}

/**
 * Invalid `$params` JSON: both buttons are effectively disabled (Fetch by `!hasValidParams`,
 * Listen directly), and the wrapping `Tooltip`'s own `disabled` prop flips to `false`; it
 * is the tooltip's "don't show" flag, so passing `hasValidParams=false` is what turns the
 * warning ON. Hovering (not simulated here, no hover precedent elsewhere in this catalog)
 * would surface "Parameters are not valid JSON" (`params.error.params-invalid-json`).
 */
export const ControlsInvalidParams: Story = {
  name: 'VisionGuiControls (invalid params, buttons disabled)',
  render: () => (
    <Card style={{maxWidth: 420}}>
      <VisionGuiControls
        hasValidParams={false}
        queryInProgress={false}
        listenInProgress={false}
        onQueryExecution={() => {}}
        onListenExecution={() => {}}
      />
    </Card>
  ),
}

// ---------------------------------------------------------------------------------------
// StyledLabel / QueryCopyLink: plain wrappers (VisionGui.styled.tsx:41-43, 65-67) around
// `@sanity/ui`'s `Label` and a bare `<a>`. Neither owns state; what varies is the props real
// callers pass. `VisionGuiHeader` uses three shapes of `StyledLabel`: plain, `muted` (used
// on the result/query labels), and `textOverflow="ellipsis"` (the custom-API-version label,
// which can overflow its 1-column grid slot). `QueryCopyLink` is shown in its one real shape:
// nested inside a `StyledLabel`, the way the header renders the "[Copy query URL]" action.
// ---------------------------------------------------------------------------------------

/** The three real prop shapes callers pass, side by side. */
export const Labels: Story = {
  name: 'StyledLabel (the three shapes callers pass)',
  render: () => (
    <Card padding={4}>
      <Stack gap={3}>
        <StyledLabel>Plain</StyledLabel>
        <StyledLabel muted>Muted (used on Result / Query labels)</StyledLabel>
        <Box style={{width: 90}}>
          <StyledLabel textOverflow="ellipsis">Custom API version (truncates)</StyledLabel>
        </Box>
      </Stack>
    </Card>
  ),
}

/** `QueryCopyLink` in its real shape: text inside a `StyledLabel`, as `VisionGuiHeader` renders it. */
export const CopyLink: Story = {
  name: 'QueryCopyLink (as VisionGuiHeader renders it)',
  render: () => (
    <Card padding={4}>
      <StyledLabel>
        Query URL:&nbsp;
        <QueryCopyLink href="#" onClick={(event) => event.preventDefault()}>
          [Copy URL to clipboard]
        </QueryCopyLink>
      </StyledLabel>
    </Card>
  ),
}

// ---------------------------------------------------------------------------------------
// InputBackgroundContainerLeft: one return (VisionGui.styled.tsx:73-77), the base floating
// label position (`position: absolute; top: 1rem; z-index: 10`) plus `left: 33px`, a literal
// pixel offset the CSS comments as "so its aligned with the gutters of CodeMirror"
// (VisionGui.css.ts:104-105). It is the container both the query editor (VisionGui.tsx:699)
// and `ParamsEditor` (ParamsEditor.tsx:38) use to float their label over the gutter. The
// 33px is not derived from CodeMirror's actual gutter width anywhere in this file, it is a
// number someone measured once. If CodeMirror's default gutter width changes upstream, this
// drifts silently; nothing here would catch it.
// ---------------------------------------------------------------------------------------

/** The floating label over a stand-in for CodeMirror's gutter, at its real 33px offset. */
export const FloatingLabelOffset: Story = {
  name: 'InputBackgroundContainerLeft (the 33px gutter offset)',
  render: () => (
    <Stack gap={3}>
      <Card border radius={2} style={{position: 'relative', height: 120, overflow: 'hidden'}}>
        <InputBackgroundContainerLeft>
          <StyledLabel muted>GROQ query</StyledLabel>
        </InputBackgroundContainerLeft>
        {/* Stand-in for CodeMirror's own gutter, drawn at a plausible width, to show what
            the 33px offset is aiming to clear. */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: 33,
            borderRight: '1px solid var(--card-border-color)',
            background: 'var(--card-muted-bg-color)',
          }}
        />
      </Card>
      <AuditNote>
        The 33px offset (VisionGui.css.ts:103-106) is a literal pixel value with a code comment as
        its only justification. It is not read from CodeMirror's gutter at runtime, so nothing
        forces the two to stay in sync.
      </AuditNote>
    </Stack>
  ),
}

// ---------------------------------------------------------------------------------------
// SaveCsvButton / SaveJsonButton: SaveResultButtons.tsx:11-58. `SaveCsvButton` is the only
// one of the two with a fallback branch: `if (!blobUrl) return <Button disabled ... />` with
// a tooltip ("Result cannot be encoded as CSV"). `SaveJsonButton` has no such branch, it
// always renders the working anchor `Button`, unconditionally on whatever `blobUrl` it gets.
// Both blob URLs come from the same `getMemoizedBlobUrlResolver` (getBlobUrl.ts), which
// returns `undefined` whenever its encoder produces `''`. Verified against the real
// `json2csv` used here: `json2csv([6])` (a bare number, e.g. a `count(...)` result, wrapped
// the way `getCsvBlobUrl` wraps non-arrays) resolves to `"\n"`, which `.trim()`s to `''`,
// so a non-tabular result reliably lands exactly on that `undefined` branch. `JSON.stringify`
// on the same value returns `"6"`, never empty, so `SaveJsonButton` never hits its own
// (non-existent) guard in practice, but the asymmetry in the source is real regardless.
// ---------------------------------------------------------------------------------------

/** A tabular result (the six-book fixture array): both buttons resolve to real blob URLs. */
export const SaveButtonsTabular: Story = {
  name: 'Save buttons (tabular result, both enabled)',
  render: () => {
    const jsonUrl = getJsonBlobUrl(visionBookResults)
    const csvUrl = getCsvBlobUrl(visionBookResults)
    return (
      <Card padding={4}>
        <Inline gap={2}>
          <SaveJsonButton blobUrl={jsonUrl} />
          <SaveCsvButton blobUrl={csvUrl} />
        </Inline>
      </Card>
    )
  },
}

/**
 * A non-tabular result: a bare number, exactly what `count(*[_type == "book"])` returns.
 * `SaveCsvButton` catches its own `undefined` and shows the disabled, tooltipped state.
 * `SaveJsonButton` has no equivalent guard and keeps working, because `JSON.stringify(6)`
 * is never empty. The two buttons diverge in behaviour even though they share the exact
 * same "what if the encoder fails" plumbing underneath.
 */
export const SaveButtonsNonTabular: Story = {
  name: 'Save buttons (non-tabular result, CSV declines, JSON does not)',
  render: () => {
    const nonTabularResult = visionBookResults.length
    const jsonUrl = getJsonBlobUrl(nonTabularResult)
    const csvUrl = getCsvBlobUrl(nonTabularResult)
    return (
      <Stack gap={3}>
        <Card padding={4}>
          <Inline gap={2}>
            <SaveJsonButton blobUrl={jsonUrl} />
            <SaveCsvButton blobUrl={csvUrl} />
          </Inline>
        </Card>
        <AuditNote>
          The CSV URL here is really undefined (encoding a wrapped bare number trims to an empty
          string), which is why the CSV button is disabled with a tooltip. JSON has no equivalent
          check: it isn't needed for this input, but nothing in the component would stop it
          rendering a dead link if it ever were.
        </AuditNote>
      </Stack>
    )
  },
}

// ---------------------------------------------------------------------------------------
// TimingsCard: VisionGui.styled.tsx:111-113, a plain `Card` wrapper. Its meaning is
// entirely in what `VisionGuiResult` puts inside it (ResultTree page shows that composed).
// Isolated here to make one fact legible: the two numbers it carries have different sources.
// `VisionGui.tsx:306-313` sets `queryTime` from `res.ms` (the value the client response
// reports) and `e2eTime` from `Date.now() - queryStart` (measured locally, round trip
// included). The labels ("Execution" / "End-to-end", i18n resources.ts:85-87) don't say
// which is which; a reader has to already know the codebase to tell them apart.
// ---------------------------------------------------------------------------------------

/** The card with realistic values: a small server-reported time, a larger round-trip time. */
export const TimingsSources: Story = {
  name: 'TimingsCard (two numbers, two different sources)',
  render: () => (
    <Stack gap={3}>
      <TimingsCard padding={4} sizing="border" style={{maxWidth: 420}}>
        <Flex align="center">
          <Box>
            <Text muted size={2}>
              Execution: 12ms
            </Text>
          </Box>
          <Box marginLeft={4}>
            <Text muted size={2}>
              End-to-end: 187ms
            </Text>
          </Box>
        </Flex>
      </TimingsCard>
      <AuditNote>
        "Execution" is the server's own report of how long it spent processing the query.
        "End-to-end" is measured locally, everything the client saw, including network time. Neither
        label says so; the gap between the two numbers is the only clue.
      </AuditNote>
    </Stack>
  ),
}

// ---------------------------------------------------------------------------------------
// Result: VisionGui.styled.tsx:103-105, a plain `Box`. Its content is decided entirely by
// `VisionGuiResult` (ResultTree page shows the composed version); in isolation, `Result`
// will render exactly whatever it's handed. That makes it the right place to answer, with
// evidence, whether "returned nothing" reads differently from "hasn't run" or "failed".
// Quoting `VisionGuiResult`'s own branches (VisionGuiResult.tsx:70-79): a query that hasn't
// run leaves every condition false and `Result` renders nothing at all. A query that ran and
// got `[]` passes `hasResult` (`typeof queryResult !== 'undefined'`) and reaches
// `ResultView`, which, because `Array.isArray([])`, mounts a real (empty) `JsonInspector`
// tree, a visible node in the DOM. A failed query renders `QueryErrorDialog`, unmistakably.
// So: not-run and empty ARE distinguishable, but only by DOM presence, not by any explicit
// "no results yet" or "0 results" copy; both look like a blank pane at a glance.
// ---------------------------------------------------------------------------------------

/**
 * All three answers to "what happened here", side by side. Not-run and empty look almost
 * identical to a skim, but only the middle panel has an actual (empty) tree node in the DOM.
 */
export const ResultPanelTogether: Story = {
  name: 'Result panel (not run / empty / failed, the pieces together)',
  render: () => (
    <Stack gap={4}>
      <Flex gap={3}>
        <Stack gap={2} flex={1}>
          <Text size={1} weight="medium">
            Never run
          </Text>
          <Card border radius={2} style={{height: 140, position: 'relative'}}>
            <Result overflow="auto" padding={3} />
          </Card>
        </Stack>
        <Stack gap={2} flex={1}>
          <Text size={1} weight="medium">
            Ran, empty array
          </Text>
          <Card border radius={2} style={{height: 140, position: 'relative', overflow: 'auto'}}>
            <Result overflow="auto" padding={3}>
              <ResultView data={[]} datasetName={VISION_DATASET} />
            </Result>
          </Card>
        </Stack>
        <Stack gap={2} flex={1}>
          <Text size={1} weight="medium">
            Failed
          </Text>
          <Card border radius={2} tone="critical" style={{height: 140, position: 'relative'}}>
            <Result overflow="auto" padding={3}>
              <QueryErrorDialog error={groqSyntaxError} />
            </Result>
          </Card>
        </Stack>
      </Flex>
      <AuditNote tone="positive">
        Not-run and error are unambiguous: nothing versus an explicit critical dialog. The one soft
        pair is not-run against a genuinely empty result: both look like a blank card unless you
        notice the middle panel has an expandable empty-array node and the left one has nothing in
        the DOM at all. There is no "0 results" or "no results yet" message anywhere in this branch
        of the source.
      </AuditNote>
      <Text size={1} weight="medium">
        The result-footer pieces, assembled the way VisionGuiResult composes them
      </Text>
      <Flex direction={['column', 'column', 'row']} gap={3}>
        <TimingsCard paddingX={4} paddingY={3} sizing="border" style={{minWidth: 0}}>
          <Flex align="center">
            <Box>
              <Text muted size={2}>
                Execution: 12ms
              </Text>
            </Box>
            <Box marginLeft={4}>
              <Text muted size={2}>
                End-to-end: 187ms
              </Text>
            </Box>
          </Flex>
        </TimingsCard>
        <DownloadsCard
          paddingX={4}
          paddingY={3}
          sizing="border"
          style={{marginLeft: 'auto', minWidth: 0}}
        >
          <SaveResultLabel muted size={2}>
            Save result as <SaveJsonButton blobUrl={getJsonBlobUrl(visionBookResults)} />
            <SaveCsvButton blobUrl={getCsvBlobUrl(visionBookResults)} />
          </SaveResultLabel>
        </DownloadsCard>
      </Flex>
    </Stack>
  ),
}
