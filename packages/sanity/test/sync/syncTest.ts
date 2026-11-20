import {type SanityDocument, type Schema} from '@sanity/types'
import {vi} from 'vitest'

import {type MutationPayload} from '../../src/core/store/document/buffered-doc/types'
import {type IdPair} from '../../src/core/store/document/types'
import {listenerGate} from '../../src/core/store/listenerGate/listenerGate'
import {FakeContentLake} from './fakeContentLake'
import {
  createStudioOperationsClient,
  createStudioPairClient,
  type EngineClient,
  type RawPatch,
  type StudioEngineOptions,
} from './studioEngine'

export type Step =
  | {client: string; do: 'patch'; id: string; patches: RawPatch[]}
  | {client: string; do: 'mutate'; id: string; mutations: MutationPayload[]}
  | {client: string; do: 'commit'}
  | {client: string; do: 'commits'; mode: 'auto' | 'hold'; latencyMs?: number}
  | {client: string; do: 'acceptCommit'}
  | {client: string; do: 'rejectCommit'; statusCode: number}
  | {client: string; do: 'listener'; mode: 'auto' | 'hold'; latencyMs?: number}
  | {client: string; do: 'releaseEvents'; count?: number; order?: 'fifo' | 'reverse'}
  | {client: string; do: 'snapshotFetches'; mode: 'auto' | 'hold'}
  | {client: string; do: 'releaseSnapshotFetches'}
  | {client: string; do: 'dropEvent'}
  | {client: string; do: 'disconnect'}
  | {client: string; do: 'reconnect'; resume: boolean}
  | {client: string; do: 'breakListener'}
  | {client: string; do: 'restoreListener'}
  | {client: string; do: 'failListener'}
  | {do: 'outside'; mutations: MutationPayload[]}
  | {do: 'setDocumentVisibility'; visibility: DocumentVisibilityState}
  | {do: 'advance'; ms: number}
  | {do: 'settle'}

export interface SyncTestDefinition {
  id: string
  title: string
  seam: 'pair' | 'operations'
  initial: SanityDocument[]
  idPair: IdPair
  clients: string[]
  /** Clients whose listener is down before they check the pair out */
  listenersDown?: string[]
  steps: Step[]
}

export interface World {
  lake: FakeContentLake
  clients: Record<string, EngineClient>
  idPair: IdPair
  advance: (ms: number) => Promise<void>
  settle: () => Promise<void>
  /** Whether the listener gate lets listeners connect (`beta.releaseBackgroundListeners`) */
  listenersActive: () => boolean
  setDocumentVisibility: (visibility: DocumentVisibilityState) => void
  teardown: () => void
}

export interface RunOptions {
  schema?: Schema
  typeName?: string
  /** `hidden` opens the clients in a background tab */
  initialDocumentVisibility?: DocumentVisibilityState
}

let worldCounter = 0

const SETTLE_STEP_MS = 1_500
const SETTLE_MAX_ROUNDS = 40
const SETTLE_QUIET_ROUNDS = 2

async function advanceTimers(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms)
}

/**
 * Every client of a world runs on the same page, so hiding it hides them all, and they share the
 * listener gate, which is enabled as with `beta.releaseBackgroundListeners`. While the page is
 * visible, the gate lets every listener connect.
 */
function createDocumentVisibility(initialVisibility: DocumentVisibilityState) {
  let visibility = initialVisibility
  const visibilitySpy = vi
    .spyOn(document, 'visibilityState', 'get')
    .mockImplementation(() => visibility)
  listenerGate.setEnabled(true)
  let listenersActive = true
  const gateSubscription = listenerGate.active$.subscribe((active) => {
    listenersActive = active
  })

  return {
    setVisibility: (next: DocumentVisibilityState) => {
      visibility = next
      document.dispatchEvent(new Event('visibilitychange'))
    },
    listenersActive: () => listenersActive,
    teardown: () => {
      gateSubscription.unsubscribe()
      listenerGate.setEnabled(false)
      visibilitySpy.mockRestore()
    },
  }
}

function createEngineClient(
  seam: SyncTestDefinition['seam'],
  common: StudioEngineOptions,
  options: RunOptions,
): EngineClient {
  if (seam === 'pair') return createStudioPairClient(common)
  const {schema, typeName} = options
  if (schema === undefined || typeName === undefined) {
    throw new Error('The operations seam needs a schema and a type name')
  }
  return createStudioOperationsClient({...common, schema, typeName})
}

export async function createWorld(
  definition: SyncTestDefinition,
  options: RunOptions = {},
): Promise<World> {
  vi.useFakeTimers()
  const documentVisibility = createDocumentVisibility(
    options.initialDocumentVisibility ?? 'visible',
  )
  worldCounter += 1
  const dataset = `sync-${worldCounter}`
  const lake = new FakeContentLake(definition.initial)
  definition.listenersDown?.forEach((clientId) => lake.client(clientId).breakListener())
  const clients = Object.fromEntries(
    definition.clients.map((clientId) => [
      clientId,
      createEngineClient(
        definition.seam,
        {lake, clientId, idPair: definition.idPair, dataset},
        options,
      ),
    ]),
  )

  async function settleFrom(round: number, quietRounds: number): Promise<number> {
    if (round === SETTLE_MAX_ROUNDS || quietRounds === SETTLE_QUIET_ROUNDS) return quietRounds
    const transactionsBefore = lake.transactions.length
    await advanceTimers(SETTLE_STEP_MS)
    const allConsistent = Object.values(clients).every((client) => client.consistent())
    const quiet = allConsistent && lake.transactions.length === transactionsBefore
    return settleFrom(round + 1, quiet ? quietRounds + 1 : 0)
  }

  async function settle(): Promise<void> {
    const quietRounds = await settleFrom(0, 0)
    if (quietRounds < SETTLE_QUIET_ROUNDS) {
      const stuck = Object.values(clients).flatMap((client) =>
        client.consistent() ? [] : [client.id],
      )
      throw new Error(
        `World did not settle within ${SETTLE_MAX_ROUNDS} rounds; inconsistent: ${stuck.join(', ') || 'none'}`,
      )
    }
  }

  function teardown(): void {
    Object.values(clients).forEach((client) => client.teardown())
    documentVisibility.teardown()
    vi.useRealTimers()
  }

  const world: World = {
    lake,
    clients,
    idPair: definition.idPair,
    advance: advanceTimers,
    settle,
    listenersActive: documentVisibility.listenersActive,
    setDocumentVisibility: documentVisibility.setVisibility,
    teardown,
  }
  // Listener welcome and snapshot fetch land on the first timer tick.
  await advanceTimers(0)
  return world
}

export async function runSteps(world: World, steps: Step[]): Promise<void> {
  for (const step of steps) {
    await runStep(world, step)
  }
}

async function runStep(world: World, step: Step): Promise<void> {
  if (step.do === 'advance') return world.advance(step.ms)
  if (step.do === 'settle') return world.settle()
  if (step.do === 'outside') {
    world.lake.mutateFromOutside(step.mutations)
    return world.advance(0)
  }
  if (step.do === 'setDocumentVisibility') {
    world.setDocumentVisibility(step.visibility)
    return world.advance(0)
  }
  const client = world.clients[step.client]
  if (client === undefined) throw new Error(`Unknown client ${step.client}`)
  const controls = world.lake.client(step.client)
  switch (step.do) {
    case 'patch':
      client.patch(step.id, step.patches)
      break
    case 'mutate':
      client.mutate(step.id, step.mutations)
      break
    case 'commit':
      client.commit()
      break
    case 'commits':
      controls.commits = {mode: step.mode, latencyMs: step.latencyMs ?? 0}
      break
    case 'acceptCommit':
      controls.acceptNextCommit()
      break
    case 'rejectCommit':
      controls.rejectNextCommit(step.statusCode)
      break
    case 'listener':
      controls.listener = {mode: step.mode, latencyMs: step.latencyMs ?? 0}
      break
    case 'releaseEvents':
      controls.releaseHeldEvents({count: step.count, order: step.order})
      break
    case 'snapshotFetches':
      controls.snapshotFetches = {mode: step.mode}
      break
    case 'releaseSnapshotFetches':
      controls.releaseSnapshotFetches()
      break
    case 'dropEvent':
      controls.dropNextHeldEvent()
      break
    case 'disconnect':
      controls.disconnect()
      break
    case 'reconnect':
      controls.reconnect({resume: step.resume})
      break
    case 'breakListener':
      controls.breakListener()
      break
    case 'restoreListener':
      controls.restoreListener()
      break
    case 'failListener':
      controls.failListener()
      break
    default:
      throw new Error(`Unknown step ${JSON.stringify(step)}`)
  }
  await world.advance(0)
}

export async function runSyncTest(
  definition: SyncTestDefinition,
  options: RunOptions = {},
): Promise<World> {
  const world = await createWorld(definition, options)
  await runSteps(world, definition.steps)
  return world
}
