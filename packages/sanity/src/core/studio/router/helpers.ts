import {isRecord} from '../../util/isRecord'
import type {Tool} from '../../config'
import type {RouterEvent, RouterStateEvent} from './types'
import {getOrderedTools} from './util/getOrderedTools'
import type {RouterState, Router} from 'sanity/router'

const WEIGHTED_CREATE_INTENT_PARAMS = ['template']
const WEIGHTED_EDIT_INTENT_PARAMS = ['mode']

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
  state: Record<string, unknown> | null,
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
  state: Record<string, unknown> | null,
): RouterState | null {
  const urlStateWithDefaultTool = resolveUrlStateWithDefaultTool(
    tools,
    makeBackwardsCompatible(tools, state),
  )

  return urlStateWithDefaultTool
}

export function resolveIntentState(
  tools: Tool[],
  prevState: RouterState | null,
  nextState: RouterState,
): RouterEvent {
  const {intent, params, payload} = nextState

  if (typeof intent !== 'string') {
    throw new Error('intent must be a string')
  }

  if (!isRecord(params)) {
    throw new Error('intent params must be a string')
  }

  const orderedTools = getOrderedTools(tools)

  const currentTool = prevState?.tool
    ? orderedTools.find((tool) => tool.name === prevState.tool)
    : null

  const otherTools = currentTool
    ? orderedTools.filter((tool) => tool !== currentTool)
    : orderedTools

  let weightedParams: string[] = []
  if (intent === 'create') {
    weightedParams = WEIGHTED_CREATE_INTENT_PARAMS
  } else if (intent === 'edit') {
    weightedParams = WEIGHTED_EDIT_INTENT_PARAMS
  }

  // Rank tools by how well they can handle the intent, based on the params they support.
  // Only the ones defined in `WEIGHTED_*_INTENT_PARAMS` are considered, and on ties in score,
  // the first tool wins. Any active tool is considered first, then the rest.
  const initialMatch: {score: number; tool: Tool<any> | null} = {score: -1, tool: null}
  const {tool: matchingTool} = (currentTool ? [currentTool, ...otherTools] : orderedTools).reduce(
    (prev, tool) => {
      if (!tool || typeof tool.canHandleIntent !== 'function') {
        return prev
      }

      const canHandle = tool.canHandleIntent(intent, params, prevState && prevState[tool.name])
      if (typeof canHandle === 'boolean') {
        // Treat `true` as a score of `0`, since an empty object also has that score
        return canHandle && prev.score < 0 ? {score: 0, tool} : prev
      }

      // Skip unknown return values
      if (!isRecord(canHandle)) {
        return prev
      }

      // Rank by number of supported, weighted values
      const score = weightedParams.reduce((prevScore, weightedParam) => {
        return weightedParam in params && canHandle[weightedParam] === true
          ? prevScore + 1
          : prevScore
      }, 0)

      return score > prev.score ? {score, tool} : prev
    },
    initialMatch,
  )

  if (matchingTool?.getIntentState) {
    const _toolState = matchingTool.getIntentState(
      intent,
      params as any,
      prevState && (prevState[matchingTool.name] as any),
      payload,
    ) as Record<string, unknown>

    const {_searchParams, ...toolState} = _toolState

    const nextUrlState: Record<string, unknown> = {
      ...prevState,
      tool: matchingTool.name,
      [matchingTool.name]: toolState,
    }
    if (matchingTool.router?.__unsafe_disableScopedSearchParams) {
      nextUrlState._searchParams = _searchParams
    } else {
      toolState._searchParams = _searchParams
    }
    return {
      type: 'state',
      isNotFound: false,
      state: nextUrlState,
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
