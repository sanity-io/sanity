import postcss, {type ChildNode, type Container, type Declaration} from 'postcss'

/**
 * Moves the rules of every `@layer <name> { … }` block to the layer's own position in the
 * stylesheet and drops the `@layer a, b, c;` order statements, so the output has no cascade
 * layers at all. Rule order is preserved, which is all the layer blocks contributed: Panda
 * emits `base`, `tokens`, `recipes` and `utilities` in that order already. Panda's
 * `--made-with-panda` marker goes too (`@sanity/pandacss-tsdown-plugin` removes it from
 * `bundle.css` itself; this keeps the CDN bundle and the dev stylesheet in line).
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

  root.walkDecls('--made-with-panda', (decl: Declaration) => {
    const rule = decl.parent
    decl.remove()
    if (rule && 'nodes' in rule && rule.nodes.length === 0) rule.remove()
  })

  unwrapLayersIn(root)

  return root.toString()
}

function unwrapLayersIn(container: Container): void {
  for (const node of [...(container.nodes ?? [])]) {
    if (node.type !== 'atrule' || node.name !== 'layer') {
      if ('nodes' in node && node.nodes) unwrapLayersIn(node)
      continue
    }
    if (!node.nodes) {
      node.remove()
      continue
    }
    unwrapLayersIn(node)
    const children: ChildNode[] = [...node.nodes]
    // postcss resets the `before` whitespace of nodes it moves after the first one; keep the
    // original (dedented) whitespace so minified input stays minified and pretty input pretty
    const before = children.map((child) => child.raws.before)
    for (const child of children) dedent(child)
    node.replaceWith(...children)
    children.forEach((child, index) => {
      const raw = before[index]
      child.raws.before = typeof raw === 'string' ? raw.replace(/\n {2}/g, '\n') : raw
    })
  }
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
