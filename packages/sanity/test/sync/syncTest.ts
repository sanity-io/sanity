import {type SanityDocument, type Schema} from '@sanity/types'
import {vi} from 'vitest'

import {type MutationPayload} from '../../src/core/store/document/buffered-doc/types'
import {type IdPair} from '../../src/core/store/document/types'
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
  | {client: string; do: 'dropEvent'}
  | {client: string; do: 'disconnect'}
  | {client: string; do: 'reconnect'; resume: boolean}
  | {do: 'outside'; mutations: MutationPayload[]}
  | {do: 'advance'; ms: number}
  | {do: 'settle'}

export interface SyncTestDefinition {
  id: string
  title: string
  seam: 'pair' | 'operations'
  initial: SanityDocument[]
  idPair: IdPair
  clients: string[]
  steps: Step[]
}

export interface World {
  lake: FakeContentLake
  clients: Record<string, EngineClient>
  idPair: IdPair
  advance: (ms: number) => Promise<void>
  settle: () => Promise<void>
  teardown: () => void
}

export interface RunOptions {
  schema?: Schema
  typeName?: string
}

let worldCounter = 0

const SETTLE_STEP_MS = 1_500
const SETTLE_MAX_ROUNDS = 40
const SETTLE_QUIET_ROUNDS = 2

async function advanceTimers(ms: number): Promise<void> {
  await vi.advanceTimersByTimeAsync(ms)
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
  worldCounter += 1
  const dataset = `sync-${worldCounter}`
  const lake = new FakeContentLake(definition.initial)
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
    vi.useRealTimers()
  }

  const world: World = {
    lake,
    clients,
    idPair: definition.idPair,
    advance: advanceTimers,
    settle,
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
    case 'dropEvent':
      controls.dropNextHeldEvent()
      break
    case 'disconnect':
      controls.disconnect()
      break
    case 'reconnect':
      controls.reconnect({resume: step.resume})
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
