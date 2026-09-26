import {evaluate, parse} from 'groq-js'
import {describe, expect, it} from 'vitest'

import {
  EXCLUDE_AGENT_VERSIONS_GROQ,
  getExcludeAgentVersionsFilter,
} from './excludeAgentVersionsFilter'

describe('getExcludeAgentVersionsFilter', () => {
  it('returns the agent-version exclusion when perspective is raw', () => {
    expect(getExcludeAgentVersionsFilter('raw')).toBe(EXCLUDE_AGENT_VERSIONS_GROQ)
  })

  it('returns the agent-version exclusion when raw is in a perspective stack', () => {
    expect(getExcludeAgentVersionsFilter(['rSummer', 'raw', 'drafts'])).toBe(
      EXCLUDE_AGENT_VERSIONS_GROQ,
    )
  })

  it('does not exclude agent versions for published, drafts, or release perspectives', () => {
    expect(getExcludeAgentVersionsFilter(undefined)).toBeUndefined()
    expect(getExcludeAgentVersionsFilter('published')).toBeUndefined()
    expect(getExcludeAgentVersionsFilter('drafts')).toBeUndefined()
    expect(getExcludeAgentVersionsFilter(['rSummer', 'drafts'])).toBeUndefined()
  })

  it('excludes agent versions without dropping other raw documents', async () => {
    const dataset = [
      {_id: 'article'},
      {_id: 'drafts.article'},
      {_id: 'versions.release.article', _system: {bundleId: 'release'}},
      {_id: 'versions.agent-run.article', _system: {bundleId: 'agent-run'}},
      {_id: 'opaque-agent-version', _system: {bundleId: 'agent-run'}},
      {_id: 'near-miss', _system: {bundleId: 'not-agent-run'}},
    ]
    const value = await evaluate(parse(`*[${EXCLUDE_AGENT_VERSIONS_GROQ}]._id`), {dataset})

    expect(await value.get()).toEqual([
      'article',
      'drafts.article',
      'versions.release.article',
      'near-miss',
    ])
  })
})
