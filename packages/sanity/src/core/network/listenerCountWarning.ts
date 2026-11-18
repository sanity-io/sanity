import {
  type ClientConfig,
  type ListenOptions,
  type ObservableSanityClient,
  type ResumableListenOptions,
  type SanityClient,
} from '@sanity/client'
// oxlint-disable-next-line eslint/no-restricted-imports -- captureOwnerStack is optional in production React
import * as React from 'react'

import {isProd} from '../environment'
import {resolveAttributedListenerFetch, subscribeListenerCounts} from './listenerCount'

/** @internal */
export const LISTENER_WARNING_THRESHOLD = 30

const LISTENER_WARNING_REARM_THRESHOLD = LISTENER_WARNING_THRESHOLD / 2
const TOP_SOURCE_COUNT = 5
const SHARED_CONNECTION_STREAM_CAPACITY = 100
const TYPICAL_STUDIO_TAB_LISTENER_COUNT = 12
const UNKNOWN_SOURCE_LABEL = 'unknown'
const STACK_TRACE_LIMIT = 50
const LIBRARY_FRAME_URL_PATTERNS = [
  '/node_modules/',
  '/.vite/deps/',
  '/packages/sanity/src/',
  '/sanity/lib/',
  '/assets/',
  'node:',
  'internal/',
]
const CHROME_STACK_FRAME_PATTERN = /^\s*at (?:.*? \()?(.+?):(\d+):\d+\)?$/
const FIREFOX_STACK_FRAME_PATTERN = /^(?:[^@\s]*@)?(.+?):(\d+):\d+$/

type ListenArgs = Parameters<SanityClient['listen']>
type ListenResult = ReturnType<SanityClient['listen']>

/** @internal */
export interface ListenerWarningSource {
  label: string
  count: number
}

/** @internal */
export interface ListenerWarningMessage {
  message: string
  open: number
  sources: ListenerWarningSource[]
}

/** @internal */
export interface ListenerLabelParts {
  callSite: string | undefined
  owner: string | undefined
  tag: string | undefined
}

const attributionCounts = new Map<string, number>()

let watcherStarted = false
let hasWarned = false

/** @internal */
export function attributeListeners(client: SanityClient): SanityClient {
  startListenerCountWatcher()
  const withOriginalConfig = client.withConfig.bind(client)
  client.listen = ((...args: ListenArgs): ListenResult =>
    withOriginalConfig(attributedFetchConfig(args[2])).listen(...args)) as SanityClient['listen']
  client.withConfig = (config) => attributeListeners(withOriginalConfig(config))
  attributeObservableListeners(client.observable)
  return client
}

function attributeObservableListeners(
  observableClient: ObservableSanityClient,
): ObservableSanityClient {
  const withOriginalConfig = observableClient.withConfig.bind(observableClient)
  observableClient.listen = ((...args: ListenArgs): ListenResult =>
    withOriginalConfig(attributedFetchConfig(args[2])).listen(
      ...args,
    )) as ObservableSanityClient['listen']
  observableClient.withConfig = (config) => attributeObservableListeners(withOriginalConfig(config))
  return observableClient
}

// Attributed inside the counting fetch so a source counts only while its connection is open
function attributedFetchConfig(
  options: ListenOptions | ResumableListenOptions | undefined,
): Partial<ClientConfig> {
  const label = resolveListenerLabel(options)
  return {resolveFetch: () => resolveAttributedListenerFetch(() => attributeListener(label))}
}

// Raised only for this capture so nested wrappers don't push the real caller out of the stack
function captureStack(): string {
  const previousStackTraceLimit = Error.stackTraceLimit
  Error.stackTraceLimit = STACK_TRACE_LIMIT
  try {
    return new Error().stack ?? ''
  } finally {
    Error.stackTraceLimit = previousStackTraceLimit
  }
}

function resolveListenerLabel(options: ListenOptions | ResumableListenOptions | undefined): string {
  const callSite = parseCallSite(captureStack())
  const ownerStack = React.captureOwnerStack?.() ?? null
  const owner = ownerStack ? parseOwnerName(ownerStack) : undefined
  return formatListenerLabel({callSite, owner, tag: options?.tag})
}

/** @internal */
export function formatListenerLabel({callSite, owner, tag}: ListenerLabelParts): string {
  if (callSite && owner) return `${callSite} (under ${owner})`
  if (callSite) return callSite
  if (owner && tag) return `under ${owner}, tag ${tag}`
  if (owner) return `under ${owner}`
  if (tag) return `tag ${tag}`
  return UNKNOWN_SOURCE_LABEL
}

function isDefaultLibraryFrame(frameUrl: string): boolean {
  return LIBRARY_FRAME_URL_PATTERNS.some((pattern) => frameUrl.includes(pattern))
}

function toCallSitePath(frameUrl: string): string {
  try {
    return new URL(frameUrl).pathname
  } catch {
    return frameUrl.split('?')[0]
  }
}

interface StackFrame {
  framePath: string
  lineNumber: string
}

function parseStackFrame(line: string): StackFrame | undefined {
  const trimmedLine = line.trim()
  const frameMatch = trimmedLine.startsWith('at ')
    ? trimmedLine.match(CHROME_STACK_FRAME_PATTERN)
    : trimmedLine.match(FIREFOX_STACK_FRAME_PATTERN)
  return frameMatch ? {framePath: frameMatch[1], lineNumber: frameMatch[2]} : undefined
}

function parseStackFrames(stack: string): StackFrame[] {
  return stack.split('\n').flatMap((line) => {
    const frame = parseStackFrame(line)
    return frame ? [frame] : []
  })
}

/** @internal */
export function parseCallSite(
  stack: string,
  isLibraryFrame: (frameUrl: string) => boolean = isDefaultLibraryFrame,
): string | undefined {
  const frames = parseStackFrames(stack)
  const ownFrameUrl = frames[0] ? toCallSitePath(frames[0].framePath) : undefined
  const callSiteFrame = frames.find((frame) => {
    const isLibrary = isLibraryFrame(frame.framePath)
    const isOwnFrame = toCallSitePath(frame.framePath) === ownFrameUrl
    return Number(isLibrary) + Number(isOwnFrame) === 0
  })

  return callSiteFrame
    ? `${toCallSitePath(callSiteFrame.framePath)}:${callSiteFrame.lineNumber}`
    : undefined
}

function parseOwnerName(ownerStack: string): string | undefined {
  const firstLine = ownerStack.split('\n').find((line) => line.trim().length > 0) ?? ''
  const chromeMatch = firstLine.match(/at\s+([^\s(]+)/)
  if (chromeMatch) return chromeMatch[1]
  const firefoxMatch = firstLine.match(/^\s*([^@\s]+)@/)
  return firefoxMatch ? firefoxMatch[1] : undefined
}

function attributeListener(label: string): () => void {
  attributionCounts.set(label, (attributionCounts.get(label) ?? 0) + 1)
  return () => decrementAttributionCount(label)
}

function decrementAttributionCount(label: string): void {
  const count = attributionCounts.get(label)
  if (count === undefined) return
  if (count > 1) {
    attributionCounts.set(label, count - 1)
    return
  }
  attributionCounts.delete(label)
}

function startListenerCountWatcher(): void {
  if (watcherStarted || isProd || typeof window === 'undefined') return
  watcherStarted = true
  subscribeListenerCounts(({open}) => checkListenerCount(open))
}

function checkListenerCount(open: number): void {
  if (open <= LISTENER_WARNING_REARM_THRESHOLD) {
    hasWarned = false
    return
  }
  if (hasWarned || open <= LISTENER_WARNING_THRESHOLD) return
  hasWarned = true
  console.warn(buildListenerWarningMessage(open, attributionCounts).message)
}

/** @internal */
export function buildListenerWarningMessage(
  open: number,
  attribution: ReadonlyMap<string, number>,
): ListenerWarningMessage {
  const sources = Array.from(attribution, ([label, count]) => ({label, count})).sort(
    (sourceA, sourceB) => sourceB.count - sourceA.count,
  )
  const attributedCount = sources.reduce((total, source) => total + source.count, 0)
  const otherClientsCount = Math.max(0, open - attributedCount)
  const topSources = sources.slice(0, TOP_SOURCE_COUNT)
  const additionalSourceCount = sources.length - topSources.length

  const sentences = [
    `[Sanity] This tab has ${open} open listeners. A Studio tab usually holds about ${TYPICAL_STUDIO_TAB_LISTENER_COUNT}.`,
    `Studio tabs share one HTTP/2 connection of about ${SHARED_CONNECTION_STREAM_CAPACITY} streams to the API, so a tab this heavy can stall requests in this tab and others.`,
    ...(topSources.length > 0
      ? [`Open listeners by source: ${formatSourceList(topSources, additionalSourceCount)}.`]
      : []),
    ...(otherClientsCount > 0 ? [`Listeners from other clients: ${otherClientsCount}.`] : []),
  ]

  return {message: sentences.join(' '), open, sources}
}

function formatSourceList(
  topSources: ListenerWarningSource[],
  additionalSourceCount: number,
): string {
  const sourceList = topSources.map((source) => `${source.label} (${source.count})`).join(', ')
  return additionalSourceCount > 0 ? `${sourceList}, and ${additionalSourceCount} more` : sourceList
}
