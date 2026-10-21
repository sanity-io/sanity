import {type BenchDocument} from '../mock-api/types'
import {defineScenario, type ScenarioStep} from './types'

const PASSES = 6
const POST_COUNT = PASSES * 2

const postId = (index: number) => `post-${index}`
const postTitle = (index: number) => `Bench post ${index}`

function buildPosts(): BenchDocument[] {
  return Array.from({length: POST_COUNT}, (_, index) => ({
    _id: postId(index),
    _type: 'post',
    title: postTitle(index),
    summary: `Summary of bench post ${index}, long enough to wrap onto a second line of the text input.`,
    slug: {_type: 'slug', current: `bench-post-${index}`},
    tags: ['bench', `post-${index}`],
    body: [
      {
        _key: `block-${index}`,
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{_key: `span-${index}`, _type: 'span', marks: [], text: postTitle(index)}],
      },
    ],
  }))
}

const listItem = (index: number) => ({css: `a[href$="/post;${postId(index)}"]`})

const postReady = (index: number) =>
  `[data-testid="form-view"] [data-testid="field-title"] input[value="${postTitle(index)}"]`

const STRUCTURE_ROOT = '[data-testid="pane-item-Post"]'

/** A trusted click on the structure tool link records no soft navigation, so this cannot be a `navigate` step. */
const returnToStructure: ScenarioStep = {
  kind: 'raw',
  label: 'return to structure',
  drive: async ({page, timeoutMs}) => {
    // Single-expression arrow: see the `__name` note in runner/session/interaction.ts
    await page.evaluate(
      () => (
        window.history.pushState(null, '', '/softNav/structure'),
        window.dispatchEvent(new PopStateEvent('popstate', {state: null}))
      ),
    )
    await page.locator(STRUCTURE_ROOT).waitFor({state: 'visible', timeout: timeoutMs})
    return {interactions: 0}
  },
}

function navigationLoop(pass: number): ScenarioStep[] {
  const first = pass * 2
  const second = first + 1
  return [
    {
      kind: 'navigate',
      label: 'pane-open',
      selector: {css: STRUCTURE_ROOT},
      url: /\/structure\/post$/,
      ready: listItem(0).css,
    },
    {
      kind: 'navigate',
      label: 'document-open',
      selector: listItem(first),
      url: new RegExp(`/structure/post;${postId(first)}$`),
      ready: postReady(first),
    },
    {
      kind: 'navigate',
      label: 'document-switch',
      selector: listItem(second),
      url: new RegExp(`/structure/post;${postId(second)}$`),
      ready: postReady(second),
    },
    {
      kind: 'navigate',
      label: 'tool-switch',
      selector: {css: '[data-testid="studio-navbar"] a[href="/softNav/empty"]:visible'},
      url: /\/softNav\/empty$/,
      ready: '[data-testid="bench-empty-tool"]',
    },
    returnToStructure,
  ]
}

export const softNav = defineScenario({
  name: 'softNav',
  sourceFile: 'perf/bench/scenarios/softNav.ts',
  path: 'structure',
  readySelector: STRUCTURE_ROOT,
  fixture: buildPosts,
  interactions: [],
  softNav: {
    passes: PASSES,
    steps: navigationLoop,
    documentOpens: ['document-open', 'document-switch'],
  },
})
