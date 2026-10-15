import postcss, {type AtRule, type ChildNode} from 'postcss'

/**
 * Moves the rules of every `@layer <name> { … }` block to the layer's own position in the
 * stylesheet and drops the `@layer a, b, c;` order statements, so the output has no cascade
 * layers at all. Rule order is preserved, which is all the layer blocks contributed: Panda
 * emits `base`, `tokens`, `recipes` and `utilities` in that order already.
 *
 * Panda CSS wraps everything it generates in cascade layers. The studio's static CSS cannot
 * live in one: styles that are not in a layer beat layered styles regardless of specificity,
 * and the `.css.ts` rules of `sanity` and `@sanity/vision` are written to override exactly such
 * unlayered styles — the styled-components rules of `@sanity/ui` v4 (injected at runtime, after
 * the static stylesheets) and the component classes of `@sanity/ui` v5, which only layers its
 * resets. The `'&&'` selectors that double a class to beat a runtime rule only work when both
 * rules are unlayered, and until this migration the vanilla-extract output always was.
 *
 * Panda's own `polyfill` option is not an alternative: it emulates the layer order with
 * `:not(#\#…)` selector chains, which raises the specificity of every rule instead of leaving
 * it alone.
 */
export function unwrapCascadeLayers(css: string): string {
  const root = postcss.parse(css)

  root.walkAtRules('layer', (atRule: AtRule) => {
    if (!atRule.nodes) {
      atRule.remove()
      return
    }

    const nodes: ChildNode[] = atRule.nodes.map((node) => node.clone())
    for (const node of nodes) {
      dedent(node)
    }
    atRule.replaceWith(...nodes)
  })

  return root.toString()
}

/**
 * Removes one level of indentation from a node and its descendants, so the rules read as if they
 * had been written at the top level. Purely cosmetic: minified output has no newlines to adjust.
 */
function dedent(node: ChildNode): void {
  for (const key of ['before', 'after'] as const) {
    const raw = node.raws[key]
    if (typeof raw === 'string') {
      node.raws[key] = raw.replace(/\n {2}/g, '\n')
    }
  }
  if ('nodes' in node && node.nodes) {
    for (const child of node.nodes) {
      dedent(child)
    }
  }
}
