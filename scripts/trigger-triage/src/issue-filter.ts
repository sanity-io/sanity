import {type GitHubIssue} from './github'

const IGNORED_LABELS = new Set(['automated', 'dependencies', 'duplicate', 'wontfix'])
const DEPENDENCY_DASHBOARD = /^Dependency Dashboard/i

export function shouldIgnore(issue: GitHubIssue): {ignore: boolean; reason?: string} {
  if (issue.user.type === 'Bot' || issue.user.login.endsWith('[bot]')) {
    return {ignore: true, reason: `bot author (@${issue.user.login})`}
  }

  const hit = issue.labels.find((label) => IGNORED_LABELS.has(label.name.toLowerCase()))
  if (hit) return {ignore: true, reason: `label "${hit.name}"`}

  if (DEPENDENCY_DASHBOARD.test(issue.title)) {
    return {ignore: true, reason: 'dependency dashboard title'}
  }

  return {ignore: false}
}
