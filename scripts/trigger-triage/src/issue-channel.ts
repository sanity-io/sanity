export function channelNameFor(repo: string, issueNumber: number): string {
  return `${repo}-issue-${issueNumber}`
}
