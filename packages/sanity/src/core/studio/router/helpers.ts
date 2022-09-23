import {Tool} from '../../config'
import {RouterState, Router} from '../../../router'
import {isRecord} from '../../util/isRecord'
import {RouterEvent, RouterStateEvent} from './types'
import {getOrderedTools} from './util/getOrderedTools'

function resolveUrlStateWithDefaultTool(tools: Tool[], state: Record<string, unknown> | null) {
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
  tools: Tool[],
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
  tools: Tool[],
  state: Record<string, unknown> | null
): RouterState | null {
  const urlStateWithDefaultTool = resolveUrlStateWithDefaultTool(
    tools,
    makeBackwardsCompatible(tools, state)
  )

  return urlStateWithDefaultTool
}

export function resolveIntentState(
  tools: Tool[],
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

    return {
      type: 'state',
      isNotFound: false,
      state: {
        ...currentState,
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

export function decodeUrlState(rootRouter: Router, pathname: string): RouterStateEvent {
  return {
    type: 'state',
    state: rootRouter.decode(pathname) || {},
    isNotFound: rootRouter.isNotFound(pathname),
  }
}

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined
}
