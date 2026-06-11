import {type Commit} from 'conventional-commits-parser'

/**
 * A commit is a breaking change when it carries a BREAKING CHANGE note —
 * either from a `BREAKING CHANGE:`/`BREAKING-CHANGE:` footer or from the `!`
 * header marker (e.g. `feat!:`), which the conventionalcommits parser options
 * turn into a note via `breakingHeaderPattern`.
 */
export function isBreakingChange(commit: Commit): boolean {
  return commit.notes.some((note) => note.title.startsWith('BREAKING'))
}
