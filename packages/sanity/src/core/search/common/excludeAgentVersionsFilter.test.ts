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
    expect(getExcludeAgentVersionsFilter(['raw'])).toBe(EXCLUDE_AGENT_VERSIONS_GROQ)
  })

  it('does not exclude agent versions for published, drafts, or release perspectives', () => {
    expect(getExcludeAgentVersionsFilter(undefined)).toBeUndefined()
    expect(getExcludeAgentVersionsFilter('published')).toBeUndefined()
    expect(getExcludeAgentVersionsFilter('drafts')).toBeUndefined()
    expect(getExcludeAgentVersionsFilter(['rSummer', 'drafts'])).toBeUndefined()
  })

  it('matches path-based and opaque agent version ids', () => {
    expect(EXCLUDE_AGENT_VERSIONS_GROQ).toContain('versions.agent-')
    expect(EXCLUDE_AGENT_VERSIONS_GROQ).toContain('_system.bundleId')
    expect(EXCLUDE_AGENT_VERSIONS_GROQ).toContain('agent-')
  })

  it('guards the bundleId check so missing _system does not null the filter', () => {
    expect(EXCLUDE_AGENT_VERSIONS_GROQ).toContain(
      '(defined(_system.bundleId) && string::startsWith(_system.bundleId, "agent-"))',
    )
  })
})
