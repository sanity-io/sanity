import getOrderedTools from '../util/getOrderedTools'
import rootRouter from '../defaultLayoutRouter'
import locationStore from 'part:@sanity/base/location'
import getConfiguredSpaces from '../util/getConfiguredSpaces'
import reconfigureClient from '../util/reconfigureClient'

function getUrlStateWithDefaultSpace(state) {
  if (state && !state.space) {
    const spaces = getConfiguredSpaces()
    const defaultSpace = spaces.find(ds => ds.default) || spaces[0]
    return Object.assign({}, state, {space: defaultSpace.name})
  }
  return null
}

function getUrlStateWithDefaultTool(state) {
  if (state && !state.tool) {
    return Object.assign({}, state, {
      tool: getOrderedTools()[0].name
    })
  }
  return null
}

function resolveIntentState(currentState, intentState) {
  const {intent, params} = intentState

  const tools = getOrderedTools()

  const currentTool = currentState.tool ? tools.find(tool => tool.name === currentState.tool) : null

  // If current tool can handle intent and if so, give it precedence
  const matchingTool = (currentTool ? [currentTool, ...tools] : tools)
    .find(tool =>
      (tool && typeof tool.canHandleIntent === 'function' && tool.canHandleIntent(intent, params)))

  if (matchingTool) {
    const toolState = matchingTool.getIntentState(intent, params)
    const currentWithState = getUrlStateWithDefaultSpace(currentState) || currentState
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
  if (currentEvent.state && currentEvent.state.intent) {
    const redirectState = resolveIntentState(prevEvent.state, currentEvent.state)
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

function maybeRedirectDefaultSpace(event) {

  const redirectState = getUrlStateWithDefaultSpace(event.state)
  if (redirectState) {
    navigate(rootRouter.encode(redirectState), {replace: true})
    return null
  }
  return event
}

function maybeRedirectFirstTool(event) {
  const redirectState = getUrlStateWithDefaultTool(event.state)
  if (redirectState) {
    navigate(rootRouter.encode(redirectState), {replace: true})
    return null
  }
  return event
}

export function navigate(newUrl, options) {
  locationStore.actions.navigate(newUrl, options)
}

export const state = locationStore
  .state
  .map(decodeUrlState)
  .scan(maybeHandleIntent)
  .filter(Boolean)
  .map(maybeRedirectDefaultSpace)
  .filter(Boolean)
  .map(maybeRedirectFirstTool)
  .filter(Boolean)
  .publishReplay(1)
  .refCount()

// Uglybugly mutation ahead.
state.map(event => event.state)
  .filter(Boolean)
  .do(reconfigureClient)
  .subscribe()
