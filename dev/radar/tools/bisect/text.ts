/** "1 commit", "4 commits" — reads better than "commit(s)" in UI copy. */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
