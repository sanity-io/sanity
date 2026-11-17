import {type Commit} from 'conventional-commits-parser'
import {type CoAuthor, descriptionToCoAuthors} from 'description-to-co-authors'

/**
 * Co-authors from a commit's `Co-authored-by:` trailers.
 *
 * conventional-commits-parser v7 recognizes git trailers as footer tokens, so
 * a message that is only a header plus trailers parses with an empty `body`
 * and the trailers in `footer`. Scan both so the result does not depend on
 * whether free-form body text precedes the trailers.
 */
export function getCoAuthors(commit: Pick<Commit, 'body' | 'footer'>): CoAuthor[] {
  const description = [commit.body, commit.footer].filter(Boolean).join('\n')
  return description ? descriptionToCoAuthors(description) : []
}
