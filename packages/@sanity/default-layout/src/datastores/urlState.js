import getOrderedTools from '../util/getOrderedTools'
import rootRouter from '../defaultLayoutRouter'
import locationStore from 'part:@sanity/base/location'

function resolveUrlStateWithDefaultTool(state) {
  if (!state || state.tool) {
    return state
  }
  return Object.assign({}, state, {
    tool: getOrderedTools()[0].name
  })
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
    const prevWithDefaults = resolveUrlStateWithDefaultTool(currentState) || currentState
    return Object.assign({}, prevWithDefaults, {
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

function maybeRedirectDefaultState(event) {
  const redirectState = resolveUrlStateWithDefaultTool(event.state)
  if (redirectState !== event.state) {
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
  .map(maybeRedirectDefaultState)
  .filter(Boolean)
  .publishReplay(1)
  .refCount()

