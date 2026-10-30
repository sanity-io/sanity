export const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql'

export const LINEAR_TARGET = {
  teamId: 'acd907c0-3e5c-4739-890a-f3396802ed25',
  projectId: 'c8fc798e-1e23-4a7a-9243-5c76d046dd2d',
  labelId: '2959f96c-127a-4c53-8f03-810dfc13be92',
} as const

export interface LinearIssueRef {
  identifier: string
  url: string
}

export interface LinearIssueWithDescription extends LinearIssueRef {
  description: string | null
}

export interface NewLinearIssue {
  title: string
  description: string
}

export interface LinearIssues {
  findBySignatureLine: (line: string) => Promise<LinearIssueRef[]>
  create: (issue: NewLinearIssue) => Promise<LinearIssueRef>
}

const SEARCH_QUERY = `query SyncVerificationSignatureSearch($filter: IssueFilter) {
  issues(filter: $filter, first: 50, includeArchived: true) {
    nodes { identifier url description }
  }
}`

const CREATE_MUTATION = `mutation SyncVerificationCreateIssue($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue { identifier url }
  }
}`

export function hasWholeLine(description: string | null, line: string): boolean {
  return (description ?? '').split('\n').some((candidate) => candidate.trim() === line)
}

export function issuesWithWholeLine(
  issues: LinearIssueWithDescription[],
  line: string,
): LinearIssueRef[] {
  return issues
    .filter((issue) => hasWholeLine(issue.description, line))
    .map(({identifier, url}) => ({identifier, url}))
}

interface GraphqlResponse<T> {
  data?: T
  errors?: Array<{message: string}>
}

export function createLinearIssues(
  apiKey: string,
  fetchImplementation: typeof fetch = fetch,
): LinearIssues {
  async function request<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await fetchImplementation(LINEAR_GRAPHQL_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': apiKey},
      body: JSON.stringify({query, variables}),
    })
    const payload = (await response.json()) as GraphqlResponse<T>
    const errors = payload.errors ?? []
    if (response.ok && errors.length === 0 && payload.data !== undefined) return payload.data
    const detail = errors.map((error) => error.message).join('; ')
    throw new Error(`Linear request failed with ${response.status}${detail ? `: ${detail}` : ''}`)
  }

  return {
    async findBySignatureLine(line) {
      const data = await request<{issues: {nodes: LinearIssueWithDescription[]}}>(SEARCH_QUERY, {
        filter: {team: {id: {eq: LINEAR_TARGET.teamId}}, description: {contains: line}},
      })
      return issuesWithWholeLine(data.issues.nodes, line)
    },
    async create(issue) {
      const data = await request<{
        issueCreate: {success: boolean; issue: LinearIssueRef | null}
      }>(CREATE_MUTATION, {
        input: {
          teamId: LINEAR_TARGET.teamId,
          projectId: LINEAR_TARGET.projectId,
          labelIds: [LINEAR_TARGET.labelId],
          title: issue.title,
          description: issue.description,
        },
      })
      if (data.issueCreate.success && data.issueCreate.issue) return data.issueCreate.issue
      throw new Error(`Linear did not create the issue "${issue.title}"`)
    },
  }
}
