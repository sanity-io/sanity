// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {isEqual} from 'lodash'
import locationStore from 'part:@sanity/base/location'
import type {Observable} from 'rxjs'
import {of} from 'rxjs'
import {
  map,
  filter,
  scan,
  publishReplay,
  refCount,
  tap,
  catchError,
  distinctUntilChanged,
} from 'rxjs/operators'
import rootRouter from '../router'
import getOrderedTools from '../util/getOrderedTools'
import reconfigureClient from '../util/reconfigureClient'
import {HAS_SPACES, CONFIGURED_SPACES} from '../util/spaces'

interface SnapshotStateEvent {
  type: 'snapshot'
  intent: {
    name: string
    params: {[key: string]: string}
  }
  isNotFound: boolean
  state: Record<string, unknown>
}

interface StateChangeEvent {
  type: 'change'
  state: Record<string, unknown>
  isNotFound: boolean
}

interface ErrorStateEvent {
  type: 'error'
  error: Error
}

type StateEvent = SnapshotStateEvent | ErrorStateEvent | StateChangeEvent

function resolveUrlStateWithDefaultSpace(state) {
  if (!HAS_SPACES || !state || state.space) {
    return state
  }
  const defaultSpace = CONFIGURED_SPACES.find((ds) => ds.default) || CONFIGURED_SPACES[0]
  return Object.assign({}, state, {space: defaultSpace.name})
}

function resolveUrlStateWithDefaultTool(state) {
  const defaultTool = getOrderedTools()[0]
  if (!state || state.tool || !defaultTool) {
    return state
  }

  return Object.assign({}, state, {
    tool: defaultTool.name,
  })
}

function makeBackwardsCompatible(state) {
  if (!state) {
    return state
  }
  if (getOrderedTools().find((tool) => tool.name === state.space)) {
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
  const {intent, params, payload} = intentState

  const tools = getOrderedTools()

  const currentTool = currentState.tool
    ? tools.find((tool) => tool.name === currentState.tool)
    : null

  // If current tool can handle intent and if so, give it precedence
  const matchingTool = (currentTool ? [currentTool, ...tools] : tools).find(
    (tool) =>
      tool &&
      typeof tool.canHandleIntent === 'function' &&
      tool.canHandleIntent(intent, params, currentState[tool.name])
  )

  if (matchingTool?.getIntentState) {
    const toolState = matchingTool.getIntentState(
      intent,
      params,
      currentState[matchingTool.name],
      payload
    )
    const currentWithState = resolveUrlStateWithDefaultSpace(currentState) || currentState
    return Object.assign({}, currentWithState, {
      tool: matchingTool.name,
      [matchingTool.name]: toolState,
    })
  }
  return {
    isNotFound: true,
    intent: {name: intent, params},
  }
}

function maybeHandleIntent(
  prevEvent: {type: string; state: Record<string, unknown>; isNotFound: boolean},
  currentEvent: {type: string; state: Record<string, unknown>; isNotFound: boolean}
) {
  if (currentEvent && currentEvent.state && currentEvent.state.intent) {
    const redirectState = resolveIntentState(prevEvent ? prevEvent.state : {}, currentEvent.state)

    if (redirectState) {
      const newUrl = rootRouter.encode(redirectState)
      setTimeout(() => navigate(newUrl, {replace: true}), 0)
      return null
    }
  }

  return currentEvent
}

function decodeUrlState(locationEvent: {type: string}) {
  return {
    type: locationEvent.type,
    state: rootRouter.decode(location.pathname),
    isNotFound: rootRouter.isNotFound(location.pathname),
  }
}

function maybeRedirectDefaultState(event: SnapshotStateEvent): StateEvent | null {
  const redirectState = resolveDefaultState(event.state)
  if (redirectState !== event.state) {
    navigate(rootRouter.encode(redirectState), {replace: true})
    return null
  }
  return event
}

export function navigate(newUrl: string, options: {replace: boolean}): void {
  locationStore.actions.navigate(newUrl, options)
}

export const state: Observable<StateEvent> = locationStore.state.pipe(
  map(decodeUrlState),
  scan(maybeHandleIntent, null),
  filter(Boolean),
  map(maybeRedirectDefaultState),
  filter(Boolean),
  distinctUntilChanged(isEqual),
  catchError((err) => of({type: 'error', error: err})),
  publishReplay(1),
  refCount()
)

export function isStateUpdateEvent(
  event: StateEvent
): event is SnapshotStateEvent | StateChangeEvent {
  return event.type === 'snapshot' || event.type === 'change'
}

if (HAS_SPACES) {
  // Uglybugly mutation ahead.
  state
    .pipe(
      filter(isStateUpdateEvent),
      map((event) => event.state),
      filter(Boolean),
      tap(reconfigureClient)
    )
    .subscribe()
}
