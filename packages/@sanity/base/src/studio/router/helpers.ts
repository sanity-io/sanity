import {Router, RouterState} from '@sanity/state-router'
import {SanityTool} from '../../config'
import {isRecord} from '../../util/isRecord'
import {LocationEvent} from './location'
import {RouterEvent} from './types'
import {getOrderedTools} from './util/getOrderedTools'

function resolveUrlStateWithDefaultSpace(
  hasSpaces: boolean,
  spaces: string[] | undefined,
  state: Record<string, unknown> | null
) {
  if (!hasSpaces || !state || state.space || spaces?.length === 0) {
    return state
  }

  const defaultSpace = spaces && spaces[0]

  return {...state, space: defaultSpace}
}

function resolveUrlStateWithDefaultTool(
  tools: SanityTool[],
  state: Record<string, unknown> | null
) {
  const orderedTools = getOrderedTools(tools)
  const defaultTool = orderedTools[0]

  if (!state || state.tool || !defaultTool) {
    return state
  }

  return Object.assign({}, state, {
    tool: defaultTool.name,
  })
}

function makeBackwardsCompatible(
  tools: SanityTool[],
  state: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!state) {
    return state
  }

  if (getOrderedTools(tools).find((tool) => tool.name === state.space)) {
    return {...state, tool: state.space, space: undefined}
  }

  return state
}

export function resolveDefaultState(
  hasSpaces: boolean,
  spaces: string[] | undefined,
  tools: SanityTool[],
  state: Record<string, unknown> | null
): RouterState | null {
  const urlStateWithDefaultTool = resolveUrlStateWithDefaultTool(
    tools,
    makeBackwardsCompatible(tools, state)
  )

  return hasSpaces
    ? resolveUrlStateWithDefaultSpace(hasSpaces, spaces, urlStateWithDefaultTool)
    : urlStateWithDefaultTool
}

export function resolveIntentState(
  hasSpaces: boolean,
  spaces: string[] | undefined,
  tools: SanityTool[],
  currentState: RouterState | null,
  intentState: RouterState
): RouterEvent {
  const {intent, params, payload} = intentState

  if (typeof intent !== 'string') {
    throw new Error('intent must be a string')
  }

  if (!isRecord(params)) {
    throw new Error('intent params must be a string')
  }

  const orderedTools = getOrderedTools(tools)

  const currentTool = currentState?.tool
    ? orderedTools.find((tool) => tool.name === currentState.tool)
    : null

  // If current tool can handle intent and if so, give it precedence
  const matchingTool = (currentTool ? [currentTool, ...orderedTools] : orderedTools).find(
    (tool) =>
      tool &&
      typeof tool.canHandleIntent === 'function' &&
      tool.canHandleIntent(intent, params, currentState && currentState[tool.name])
  )

  if (matchingTool?.getIntentState) {
    const toolState = matchingTool.getIntentState(
      intent,
      params as any,
      currentState && (currentState[matchingTool.name] as any),
      payload
    )

    const currentWithState =
      resolveUrlStateWithDefaultSpace(hasSpaces, spaces, currentState) || currentState

    return {
      type: 'state',
      isNotFound: false,
      state: {
        ...currentWithState,
        tool: matchingTool.name,
        [matchingTool.name]: toolState,
      },
    }
  }

  return {
    type: 'intent',
    isNotFound: true,
    intent: {name: intent, params},
  }
}

export function decodeUrlState(rootRouter: Router, locationEvent: LocationEvent): RouterEvent {
  return {
    type: 'state',
    state: rootRouter.decode(locationEvent.location.pathname) || {},
    isNotFound: rootRouter.isNotFound(locationEvent.location.pathname),
  }
}

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}
