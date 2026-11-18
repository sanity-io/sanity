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
const TYPICAL_STUDIO_TAB_LISTENER_COUNT = 12
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
const COMPILER_GENERATED_OWNER_PATTERN = /^_temp\d*(\$\d+)?$/
const FIREFOX_STACK_FRAME_PATTERN = /^(?:[^@\s]*@)?(.+?):(\d+):\d+$/

type ListenArgs = Parameters<SanityClient['listen']>
type ListenResult = ReturnType<SanityClient['listen']>

/** @internal */
export interface ListenerWarningSource {
  label: string
  count: number
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

interface ListenableClient {
  listen?: unknown
  withConfig?: unknown
}

function isListenable(candidate: ListenableClient | undefined): boolean {
  return typeof candidate?.listen === 'function' && typeof candidate.withConfig === 'function'
}

/** @internal */
export function attributeListeners(client: SanityClient): SanityClient {
  if (isListenable(client) && isListenable(client.observable)) {
    startListenerCountWatcher()
    const originalListen = client.listen.bind(client)
    const withOriginalConfig = client.withConfig.bind(client)
    client.listen = ((...args: ListenArgs): ListenResult => {
      const configuredClient = withOriginalConfig(attributedFetchConfig(args[2]))
      return configuredClient === client
        ? originalListen(...args)
        : configuredClient.listen(...args)
    }) as SanityClient['listen']
    client.withConfig = (config) => {
      const configuredClient = withOriginalConfig(config)
      return configuredClient === client ? client : attributeListeners(configuredClient)
    }
    attributeObservableListeners(client.observable)
  }
  return client
}

function attributeObservableListeners(
  observableClient: ObservableSanityClient,
): ObservableSanityClient {
  if (isListenable(observableClient)) {
    const originalListen = observableClient.listen.bind(observableClient)
    const withOriginalConfig = observableClient.withConfig.bind(observableClient)
    observableClient.listen = ((...args: ListenArgs): ListenResult => {
      const configuredClient = withOriginalConfig(attributedFetchConfig(args[2]))
      return configuredClient === observableClient
        ? originalListen(...args)
        : configuredClient.listen(...args)
    }) as ObservableSanityClient['listen']
    observableClient.withConfig = (config) => {
      const configuredClient = withOriginalConfig(config)
      return configuredClient === observableClient
        ? observableClient
        : attributeObservableListeners(configuredClient)
    }
  }
  return observableClient
}

// Attributed inside the counting fetch so a source counts only while its connection is open
function attributedFetchConfig(
  options: ListenOptions | ResumableListenOptions | undefined,
): Partial<ClientConfig> {
  const label = resolveListenerLabel(options)
  return label
    ? {resolveFetch: () => resolveAttributedListenerFetch(() => attributeListener(label))}
    : {}
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

function resolveListenerLabel(
  options: ListenOptions | ResumableListenOptions | undefined,
): string | undefined {
  const callSite = parseCallSite(captureStack())
  const ownerStack = React.captureOwnerStack?.() ?? null
  const owner = ownerStack ? parseOwnerName(ownerStack) : undefined
  return formatListenerLabel({callSite, owner, tag: options?.tag})
}

/** @internal */
export function formatListenerLabel({
  callSite,
  owner,
  tag,
}: ListenerLabelParts): string | undefined {
  if (callSite) return callSite
  const ownerName = owner && COMPILER_GENERATED_OWNER_PATTERN.test(owner) ? undefined : owner
  if (ownerName && tag) return `<${ownerName}> (tag "${tag}")`
  if (ownerName) return `<${ownerName}>`
  return tag ? `listeners tagged "${tag}"` : undefined
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
  console.warn(buildListenerWarningMessage(open, attributionCounts))
}

/** @internal */
export function buildListenerWarningMessage(
  open: number,
  attribution: ReadonlyMap<string, number>,
): string {
  const topSource = findTopSource(attribution)
  const attributedCount = Array.from(attribution.values()).reduce(
    (total, count) => total + count,
    0,
  )
  const unlabelledCount = open - attributedCount
  const sourceClause =
    topSource && topSource.count > unlabelledCount
      ? `, and ${topSource.count} of them come from ${topSource.label}`
      : ''
  return `[sanity] This tab has ${open} open listeners${sourceClause}. A Studio tab usually has about ${TYPICAL_STUDIO_TAB_LISTENER_COUNT}. Too many can stall requests in every open Studio tab.`
}

function findTopSource(
  attribution: ReadonlyMap<string, number>,
): ListenerWarningSource | undefined {
  return Array.from(attribution, ([label, count]) => ({label, count})).reduce<
    ListenerWarningSource | undefined
  >(
    (topSource, source) => (topSource && topSource.count >= source.count ? topSource : source),
    undefined,
  )
}
