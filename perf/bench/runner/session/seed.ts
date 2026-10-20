import {type BenchScenario, scenarioFixture} from '../../scenarios/types'
import {type RunningSide} from '../servers'

/**
 * Put the mock back to a scenario's starting state before a session, in
 * process — no HTTP round-trips to our own mock. Every session mode goes
 * through this, so a new mode cannot skip feature activation and leave the
 * feature under test on its upsell path (see mock-api/features: the symptom
 * is a visibility timeout a step or two downstream, not an obvious one).
 */
export function resetMockForScenario(running: RunningSide, scenario: BenchScenario): void {
  running.mock.hub.closeAll()
  running.mock.store.reset()
  running.mock.ledger.reset()
  running.mock.setActiveFeatures(scenario.features ?? [])
  running.mock.store.seed(scenarioFixture(scenario))
}
