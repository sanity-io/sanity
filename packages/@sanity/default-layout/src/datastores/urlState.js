import locationStore from 'part:@sanity/base/location'
import getOrderedTools from '../util/getOrderedTools'
import reconfigureClient from '../util/reconfigureClient'
import {HAS_SPACES, CONFIGURED_SPACES} from '../util/spaces'
import rootRouter from '../defaultLayoutRouter'
import {map, filter, scan, publishReplay, refCount, tap} from 'rxjs/operators'

function resolveUrlStateWithDefaultSpace(state) {
  if (!HAS_SPACES || !state || state.space) {
    return state
  }
  const defaultSpace = CONFIGURED_SPACES.find(ds => ds.default) || CONFIGURED_SPACES[0]
  return Object.assign({}, state, {space: defaultSpace.name})
}

function resolveUrlStateWithDefaultTool(state) {
  if (!state || state.tool) {
    return state
  }
  return Object.assign({}, state, {
    tool: getOrderedTools()[0].name
  })
}

function makeBackwardsCompatible(state) {
  if (!state) {
    return state
  }
  if (getOrderedTools().find(tool => tool.name === state.space)) {
    return Object.assign({}, state, {tool: state.space, space: undefined})
  }
  return state
}

function resolveDefaultState(state) {
  const urlStateWithDefaultTool = resolveUrlStateWithDefaultTool(makeBackwardsCompatible(state))
  return HAS_SPACES
    ? resolveUrlStateWithDefaultSpace(urlStateWithDefaultTool)
    : urlStateWithDefaultTool
}

function resolveIntentState(currentState, intentState) {
  const {intent, params} = intentState

  const tools = getOrderedTools()

  const currentTool = currentState.tool ? tools.find(tool => tool.name === currentState.tool) : null

  // If current tool can handle intent and if so, give it precedence
  const matchingTool = (currentTool ? [currentTool, ...tools] : tools).find(
    tool =>
      tool &&
      typeof tool.canHandleIntent === 'function' &&
      tool.canHandleIntent(intent, params, currentState[tool.name])
  )

  if (matchingTool) {
    const toolState = matchingTool.getIntentState(intent, params, currentState[matchingTool.name])
    const currentWithState = resolveUrlStateWithDefaultSpace(currentState) || currentState
    return Object.assign({}, currentWithState, {
      tool: matchingTool.name,
      [matchingTool.name]: toolState
    })
  }
  return {
    isNotFound: true,
    intent: {name: intent, params}
  }
}

function maybeHandleIntent(prevEvent, currentEvent) {
  if (currentEvent && currentEvent.state && currentEvent.state.intent) {
    const redirectState = resolveIntentState(prevEvent ? prevEvent.state : {}, currentEvent.state)
    if (redirectState) {
      navigate(rootRouter.encode(redirectState), {replace: true})
      return null
    }
  }
  return currentEvent
}

function decodeUrlState(locationEvent) {
  return {
    type: locationEvent.type,
    state: rootRouter.decode(location.pathname),
    isNotFound: rootRouter.isNotFound(location.pathname)
  }
}

function maybeRedirectDefaultState(event) {
  const redirectState = resolveDefaultState(event.state)
  if (redirectState !== event.state) {
    navigate(rootRouter.encode(redirectState), {replace: true})
    return null
  }
  return event
}

export function navigate(newUrl, options) {
  locationStore.actions.navigate(newUrl, options)
}

export const state = locationStore.state.pipe(
  map(decodeUrlState),
  scan(maybeHandleIntent, null),
  filter(Boolean),
  map(maybeRedirectDefaultState),
  filter(Boolean),
  publishReplay(1),
  refCount()
)

if (HAS_SPACES) {
  // Uglybugly mutation ahead.
  state
    .pipe(
      map(event => event.state),
      filter(Boolean),
      tap(reconfigureClient)
    )
    .subscribe()
}
