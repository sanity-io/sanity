import {type CompletionContext, type CompletionResult} from '@codemirror/autocomplete'
import {syntaxTree} from '@codemirror/language'
import {Facet} from '@codemirror/state'

import {type GroqNode} from './groqFunctions'
import {isQueryParamName} from './queryParamName'

/** Param names from the params JSON, offered when the query editor types `$` */
export const NO_QUERY_PARAM_NAMES: readonly string[] = []

export const queryParamNames = Facet.define<readonly string[], readonly string[]>({
  combine: (values) => values[0] ?? NO_QUERY_PARAM_NAMES,
})

const PARAM_BEFORE_CURSOR = /\$[A-Za-z0-9_]*$/

function inCommentOrString(context: CompletionContext): boolean {
  for (
    let node: GroqNode | null = syntaxTree(context.state).resolveInner(context.pos, -1);
    node;
    node = node.parent
  ) {
    if (node.name === 'String' || node.name === 'LineComment' || node.name === 'BlockComment') {
      return true
    }
  }
  return false
}

/**
 * Completes `$` in the query with the names present in the params JSON. Typing `$` offers every
 * name; typing `$f` narrows that to names starting with `f`. Nothing is offered inside a string
 * or a comment, or when the JSON has no param names.
 */
export function paramCompletions(context: CompletionContext): CompletionResult | null {
  const names = context.state.facet(queryParamNames).filter(isQueryParamName)
  if (names.length === 0 || inCommentOrString(context)) return null
  const word = context.matchBefore(PARAM_BEFORE_CURSOR)
  if (!word) return null
  const typed = word.text.slice(1).toLowerCase()
  const options = names
    .filter((name) => name.toLowerCase().startsWith(typed))
    .map((name) => ({label: `$${name}`, type: 'variable' as const}))
  if (options.length === 0) return null
  return {from: word.from, options, filter: false}
}
