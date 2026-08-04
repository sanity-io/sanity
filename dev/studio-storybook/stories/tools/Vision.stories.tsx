import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from real source (org contract §8): the entire Vision tool that ships
// inside Studio (`visionTool()`), mounted whole against a canned-response client. This page
// is the In-Context capstone that sits above the decomposed part pages
// (QueryEditor / ParamsEditor / Controls / ResultTree / Errors / SavedQueries) — the same
// components, assembled and live.
import {DEFAULT_API_VERSION} from '../../../../packages/@sanity/vision/src/apiVersions'
import {VisionGui} from '../../../../packages/@sanity/vision/src/components/VisionGui'
import {createMockVisionClient} from '../../lib/mockVisionClient'
import {WithStudioProviders} from '../../lib/testProvider'
import {VISION_DATASET, visionSchemaTypes} from '../../lib/visionStoryKit'

const meta: Meta = {
  title: 'Lists & Data/Vision/In Context',
  parameters: {
    padding: 0,
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Vision is where developers go to ask the dataset a question directly. It is a full ' +
            'GROQ playground living inside Studio: type a query, press Fetch, and read exactly ' +
            'what the Content Lake returns, the same query, the same client, the same result a ' +
            'front end would get. For anyone building on Sanity it is the fastest way to confirm ' +
            'a query does what it should before wiring it into code.',
          '',
          '|          |                                                                                                                                                                                               |',
          '| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/@sanity/vision`, Studio-only (no design-system equivalent); ships as the `vision` tool plugin (`visionTool()`), CodeMirror editors, result tree via `@rexxars/react-json-inspector` |',
          '| Tier     | SERVICE. A developer tool layered over the client seam. It reads and shapes content through `useClient().observable.fetch`, owns no content model of its own, and is opt-in per Studio config |',
          '| Audit    | 🔴 needs-work, findings spread across the six part pages: `sampling-disclosure` · `datatips` · `query-result-shaping` (a fourth, `explain-the-query`, sits on Errors)                         |',
          '| Patterns | `sampling-disclosure` · `query-result-shaping` · `datatips` · `explain-the-query`                                                                                                             |',
          '',
          'This is the **In Context** capstone for the Vision pages. The tool decomposes into ' +
            'six shipped parts, each with its own page under **Lists & Data / Vision**:',
          '',
          '- **QueryEditor**: the GROQ CodeMirror pane (syntax highlighting, no inline ' +
            'diagnostics).',
          '- **ParamsEditor**: the JSON `$params` pane (inline parse validation).',
          '- **Controls**: the dataset / API-version / perspective selectors and query-URL ' +
            'copy.',
          '- **ResultTree**: the JSON result tree, timings footer, and downloads (the ' +
            '`datatips`, `query-result-shaping`, and `sampling-disclosure` findings live here).',
          '- **Errors**: the GROQ error display (the error-size typography finding lives here).',
          '- **SavedQueries**: the personal + shared saved-query rail (`QueryRecall`).',
          '',
          'Below, the whole thing runs at once. Pressing **Fetch** (or Ctrl/Cmd+Enter) executes ' +
            'offline against a canned-response client (`lib/mockVisionClient.ts`) and renders the ' +
            'real result tree, timings, and request URL: the whole playground, no network.',
          '',
          'Harness notes: `VisionGui` resolves its query client from Studio context ' +
            '(`useClient()`), not from its `client` prop, so the canned client is injected ' +
            'through `WithStudioProviders({client})` → the mock auth store → ' +
            '`source.getClient()`. The tool also owns document-level `paste` / `keydown` ' +
            'listeners and a `window.innerWidth`-sized split pane; both are real here. The ' +
            'saved-queries rail on the right is live for personal queries (key-value store); ' +
            'shared queries need a real workspace dataset (see the SavedQueries page).',
          '',
          '> **Why it matters:** Because this is the live surface and not a mockup, the audit ' +
            'findings are reproducible right here: after a fetch, watch the footer stay silent on ' +
            'count and truncation, note there is no table view or hover datatip on the tree, and ' +
            'trigger an error to see it print smaller than the result it replaced.',
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
  tags: [
    'autodocs',
    'chapter:data',
    'pattern:sampling-disclosure',
    'pattern:query-result-shaping',
    'pattern:datatips',
    'pattern:explain-the-query',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * **The whole tool, offline.** The real `VisionGui`: the GROQ editor, params pane,
 * perspective / dataset / API-version controls, result pane, and the saved-queries rail are
 * all live. Type a query (or use the default) and press **Fetch**: the request runs against
 * the fixture books with real latency and renders the real result tree, timings, and request
 * URL. `Ctrl/Cmd+Enter` runs it too.
 */
export const FullTool: Story = {
  name: 'Full tool (live, canned responses)',
  parameters: {
    docs: {story: {height: '640px', inline: false}},
  },
  render: () => (
    <div style={{height: 620, display: 'flex'}}>
      <VisionGui
        client={createMockVisionClient()}
        config={{defaultApiVersion: DEFAULT_API_VERSION}}
        datasets={[VISION_DATASET, 'production', 'staging']}
        projectId="mock-project-id"
        defaultDataset={VISION_DATASET}
      />
    </div>
  ),
}
