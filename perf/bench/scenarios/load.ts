import {AUTH_PROVIDERS} from '../mock-api/project'
import {defineScenario, type StepSelector} from './types'

/**
 * Load scenarios (pageload mode only): how soon the studio lets a user act,
 * on two minimal workspaces of their own so the numbers are dominated by the
 * studio shell rather than a schema — `structureTool` (the structure tool
 * and one document type) and `emptyTool` (a single tool that renders a
 * marker, the shell baseline the structure tool is measured against). No
 * document is opened, so none is seeded.
 */

const SOURCE_FILE = 'perf/bench/scenarios/load.ts'

/** The login screen's provider link (the mock serves one provider). */
const LOGIN_BUTTON: StepSelector = {css: `a[href^="${AUTH_PROVIDERS.providers[0].url}"]`}

/** The structure tool's root list pane has rendered its items. */
const TOOL_VISIBLE: StepSelector = {css: '[data-testid^="pane-item-"]'}

/** The empty tool (studio/components/emptyTool.tsx) has rendered. */
const EMPTY_TOOL_VISIBLE: StepSelector = {testId: 'bench-empty-tool'}

const structure = {
  sourceFile: SOURCE_FILE,
  workspace: 'structureTool',
  path: 'structure',
  interactions: [],
}

/** Logged out: navigation start → the login button can be clicked. */
export const loginReady = defineScenario({
  ...structure,
  name: 'loginReady',
  load: {
    auth: 'logged-out',
    steps: [{kind: 'awaitClickable', selector: LOGIN_BUTTON, milestone: 'login clickable'}],
  },
})

/**
 * Logged out, then log in: the login click lands on the fake provider, which
 * redirects back to the studio (a new navigation), so the tool milestone
 * runs from the callback page's navigation start — the post-login
 * boot, with the HTTP cache primed by the login screen as it would be for a
 * real user. Cold only: the login stores a token the warm page would inherit.
 */
export const loginToTool = defineScenario({
  ...structure,
  name: 'loginToTool',
  load: {
    auth: 'logged-out',
    conditions: ['boot-cold'],
    steps: [
      {kind: 'click', selector: LOGIN_BUTTON},
      {kind: 'awaitVisible', selector: TOOL_VISIBLE, milestone: 'tool visible after login'},
    ],
  },
})

/** Already signed in: navigation start → the structure tool shows its items. */
export const toolReady = defineScenario({
  ...structure,
  name: 'toolReady',
  load: {
    steps: [{kind: 'awaitVisible', selector: TOOL_VISIBLE, milestone: 'tool visible'}],
  },
})

const emptyTool = {sourceFile: SOURCE_FILE, workspace: 'emptyTool', path: 'empty', interactions: []}

/** Already signed in: navigation start → the empty tool renders. */
export const emptyToolReady = defineScenario({
  ...emptyTool,
  name: 'emptyToolReady',
  load: {
    steps: [{kind: 'awaitVisible', selector: EMPTY_TOOL_VISIBLE, milestone: 'tool visible'}],
  },
})

/** loginToTool, landing on the empty tool. */
export const loginToEmptyTool = defineScenario({
  ...emptyTool,
  name: 'loginToEmptyTool',
  load: {
    auth: 'logged-out',
    conditions: ['boot-cold'],
    steps: [
      {kind: 'click', selector: LOGIN_BUTTON},
      {kind: 'awaitVisible', selector: EMPTY_TOOL_VISIBLE, milestone: 'tool visible after login'},
    ],
  },
})
