import {describe, expect, it} from 'vitest'

import {buildDeploymentsQuery, parseCommitGitHubInfo} from './githubDeployments'

const SHA_A = 'a'.repeat(40)
const SHA_B = 'b'.repeat(40)

describe('buildDeploymentsQuery', () => {
  it('emits one alias per sha with both environments and the author login', () => {
    const query = buildDeploymentsQuery([SHA_A, SHA_B])
    expect(query).toContain(`c0: object(oid: "${SHA_A}")`)
    expect(query).toContain(`c1: object(oid: "${SHA_B}")`)
    expect(query).toContain('Production – test-studio')
    expect(query).toContain('Preview – test-studio')
    expect(query).toContain('author { user { login avatarUrl(size: 132) } }')
    expect(query).toContain('repository(owner: "sanity-io", name: "sanity")')
  })

  it('rejects anything that is not a full lowercase hex sha', () => {
    expect(() => buildDeploymentsQuery(['unknown'])).toThrow(/Not a full lowercase sha/)
    expect(() => buildDeploymentsQuery([SHA_A.slice(0, 12)])).toThrow(/Not a full lowercase sha/)
    expect(() => buildDeploymentsQuery(['A'.repeat(40)])).toThrow(/Not a full lowercase sha/)
    // Injection shape: quote/brace smuggling must throw, never embed
    expect(() => buildDeploymentsQuery(['"] } evil { ["'])).toThrow(/Not a full lowercase sha/)
  })
})

function response(commits: Record<string, unknown>) {
  return {repository: commits}
}

describe('parseCommitGitHubInfo', () => {
  it('maps shas to the first successful deploy URL and the author login', () => {
    const info = parseCommitGitHubInfo(
      response({
        c0: {
          author: {user: {login: 'ada', avatarUrl: 'https://avatars.githubusercontent.com/u/1'}},
          deployments: {
            nodes: [{latestStatus: {state: 'SUCCESS', environmentUrl: 'https://a.sanity.dev'}}],
          },
        },
        c1: {
          author: {user: null}, // email GitHub can't map
          deployments: {
            nodes: [
              {latestStatus: {state: 'ERROR', environmentUrl: 'https://broken.sanity.dev'}},
              {latestStatus: {state: 'SUCCESS', environmentUrl: 'https://b.sanity.dev'}},
            ],
          },
        },
      }),
      [SHA_A, SHA_B],
    )
    expect(info.get(SHA_A)).toEqual({
      testStudioUrl: 'https://a.sanity.dev',
      authorLogin: 'ada',
      authorAvatarUrl: 'https://avatars.githubusercontent.com/u/1',
    })
    expect(info.get(SHA_B)).toEqual({testStudioUrl: 'https://b.sanity.dev'})
  })

  it('keeps the login for commits whose build was skipped, and vice versa', () => {
    const info = parseCommitGitHubInfo(
      response({
        c0: {author: {user: {login: 'ada'}}, deployments: {nodes: []}},
        c1: {author: null, deployments: {nodes: [{latestStatus: {state: 'IN_PROGRESS'}}]}},
      }),
      [SHA_A, SHA_B],
    )
    expect(info.get(SHA_A)).toEqual({authorLogin: 'ada'})
    expect(info.has(SHA_B)).toBe(false)
  })

  it('resolves nothing for unknown oids and unfinished deploys', () => {
    const info = parseCommitGitHubInfo(
      response({
        c0: null, // oid not found
        c1: {deployments: {nodes: [{latestStatus: null}]}},
        c2: {deployments: {nodes: [{latestStatus: {state: 'SUCCESS', environmentUrl: null}}]}},
      }),
      [SHA_A, SHA_B, 'c'.repeat(40)],
    )
    expect(info.size).toBe(0)
  })

  it('tolerates a missing repository payload', () => {
    expect(parseCommitGitHubInfo(null, [SHA_A]).size).toBe(0)
    expect(parseCommitGitHubInfo({}, [SHA_A]).size).toBe(0)
  })
})
