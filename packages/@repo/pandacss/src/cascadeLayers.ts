/*
 * A copy of `src/cascadeLayers.ts` of @sanity/pandacss-tsdown-plugin 0.2.0 (sanity-io/pkg-utils),
 * the pass behind its `cascadeLayers: false` option, which `packages/sanity/tsdown.config.ts`
 * uses for the published `bundle.css`. The package does not export the pass, and the apps that
 * build the Panda sources with `@pandacss/vite` (the dev studios, Storybook, the vitest browser
 * suite, the CDN bundle) need the same output: `unlayeredPandaCss()` in ./vite.ts applies it to
 * the stylesheet the plugin fills. Replace this file with an import once the package exports it;
 * until then, keep it identical to the upstream source so the dev and the published CSS agree.
 */
import {transform} from 'lightningcss'
import {
  atRule,
  parse,
  rule as styleRule,
  type AtRule,
  type ChildNode,
  type Container,
  type Root,
  type Rule,
} from 'postcss'

/** A rule with a block: a style rule, or an at-rule such as `@media print { … }`. */
type BlockRule = Rule | AtRule

/**
 * A rule around rules of a layer, such as `@media print`, with the rules around it. There is one
 * per block as written, so the parts of the block that land next to each other in the output can
 * be put back in one copy of it.
 */
interface Wrapper {
  readonly rule: BlockRule
  readonly parent: Wrapper | undefined
}

/** A node that belongs to a layer, with the innermost block rule it was written in, if any. */
interface LayerEntry {
  readonly node: ChildNode
  readonly wrapper: Wrapper | undefined
}

/** A cascade layer: its sublayers in declaration order, and the nodes directly inside it. */
interface LayerNode {
  /** The last segment of the layer's name; a symbol for an anonymous layer. */
  readonly name: string | symbol
  readonly sublayers: Map<string | symbol, LayerNode>
  readonly entries: LayerEntry[]
}

/** Statements that have to stay ahead of the other rules of a stylesheet. */
const LEADING_STATEMENTS = new Set(['charset', 'import', 'namespace'])

const encoder = new TextEncoder()

/**
 * Removes every `@layer` block and statement from a stylesheet, ordering the rules so that source
 * order alone gives them the precedence the layers gave them: a layer's sublayers come in the
 * order they were first declared, before the rules directly inside the layer, which beat every
 * sublayer, and the rules outside any layer come last, since they beat every layer. Panda relies
 * on this for its `compositions` sublayer, which it emits after the utilities it has to lose to,
 * and it spreads the `recipes` layer over a `@layer recipes` and a `@layer recipes.slots` block.
 *
 * Source order is all a stylesheet without layers has, though: a more specific rule in an earlier
 * layer, which used to lose to a later layer, now wins, and `!important` declarations, whose layer
 * order is reversed, follow the same order as normal ones.
 *
 * A conditional rule (`@media print { @layer x { … } }`, likewise `@supports`, `@container` or a
 * style rule with nested rules) doesn't scope the layers in it, so its rules join the layers they
 * belong to, each part of it in a copy of the rule: layer order holds across its boundary.
 * Browsers only declare a layer in a conditional rule whose condition holds, though, so the order
 * of a layer first declared in one depends on the condition; here it is the order with every
 * condition holding. `@charset`, `@import` and `@namespace` statements stay ahead of the other
 * rules, where they have to be.
 *
 * The stylesheet is parsed with PostCSS, whose tree keeps the text of every rule as written, so
 * the rules come out as they went in, their text untouched apart from the indentation of the ones
 * that moved; only their order and nesting change. It runs last in the plugin, on the stylesheet
 * lightningcss printed, so lightningcss's lowering, merging and minification, and the
 * `lightningcss.visitor` of the options, see Panda's layered output. A lightningcss visitor
 * cannot do this itself: a visitor of the layer blocks hands every rule in them to JavaScript,
 * which takes several times longer than parsing with PostCSS, and lightningcss 1.33 fails to
 * read back any `var()` it serialized, so the rules cannot be returned to it reordered.
 */
export function unwrapCascadeLayers(css: string): string {
  // The common case for a stylesheet without layers: nothing to parse
  if (!css.includes('@layer')) return css

  const root = parse(css)
  const collection = collectLayers(root)
  if (!collection.hasLayers) return css

  const indentUnit = detectIndentUnit(root)
  // Every container the collection descended into is emptied before its nodes are appended
  // elsewhere, so each append is a push rather than a search of the old parent's children
  for (const container of collection.descended) container.removeAll()
  root.append(...collection.leading)
  rewrap(root, flattenLayer(collection.root))
  reindent(root, indentUnit)
  return root.toString()
}

interface LayerCollection {
  /** The layer tree, with the unlayered rules as the entries of the root. */
  readonly root: LayerNode
  /** The `@charset`, `@import` and `@namespace` statements of the stylesheet. */
  readonly leading: ChildNode[]
  /** The containers whose children were collected: the layer blocks and the blocks around them. */
  readonly descended: Container[]
  readonly hasLayers: boolean
}

function collectLayers(stylesheet: Root): LayerCollection {
  const root: LayerNode = {name: Symbol('root'), sublayers: new Map(), entries: []}
  const leading: ChildNode[] = []
  const descended: Container[] = []
  let hasLayers = false

  function collect(container: Container, layer: LayerNode, wrapper: Wrapper | undefined): void {
    descended.push(container)
    for (const node of container.nodes ?? []) {
      if (node.type === 'atrule' && isLayerRule(node)) {
        hasLayers = true
        const names = layerNames(node.params)
        // An invalid `@layer` rule (`@layer a b;`, `@layer a, b { … }`) is ignored, like a
        // browser ignores it. lightningcss rejects them before the plugin gets here.
        if (node.nodes === undefined) {
          for (const name of names ?? []) resolveLayer(layer, name)
        } else if (names !== undefined && names.length <= 1) {
          // Every anonymous `@layer { … }` block is a layer of its own
          const sublayer = resolveLayer(layer, names[0] ?? [Symbol('anonymous')])
          collect(node, sublayer, wrapper)
        }
      } else if (
        layer === root &&
        wrapper === undefined &&
        node.type === 'atrule' &&
        node.nodes === undefined &&
        LEADING_STATEMENTS.has(node.name.toLowerCase())
      ) {
        leading.push(node)
      } else if (isBlockRule(node) && containsLayer(node)) {
        collect(node, layer, {rule: node, parent: wrapper})
      } else {
        layer.entries.push({node, wrapper})
      }
    }
  }

  collect(stylesheet, root, undefined)
  return {root, leading, descended, hasLayers}
}

/** The (sub)layer a layer name (`['recipes', 'slots']`) names, declared on first use. */
function resolveLayer(parent: LayerNode, name: readonly (string | symbol)[]): LayerNode {
  let node = parent
  for (const segment of name) {
    let sublayer = node.sublayers.get(segment)
    if (!sublayer) {
      sublayer = {name: segment, sublayers: new Map(), entries: []}
      node.sublayers.set(segment, sublayer)
    }
    node = sublayer
  }
  return node
}

/** The entries of a layer and its sublayers, in the order of the layer's precedence. */
function flattenLayer(layer: LayerNode): LayerEntry[] {
  return [...[...layer.sublayers.values()].flatMap(flattenLayer), ...layer.entries]
}

/**
 * Appends the nodes of the entries to the stylesheet, in copies of the block rules they were
 * written in: consecutive entries of one block share one copy of it.
 */
function rewrap(stylesheet: Root, entries: readonly LayerEntry[]): void {
  /** The copies the previous entry went into, outermost first. */
  let open: {wrapper: Wrapper; copy: BlockRule}[] = []
  for (const {node, wrapper} of entries) {
    const wrappers: Wrapper[] = []
    for (let current = wrapper; current; current = current.parent) wrappers.unshift(current)
    let shared = 0
    while (shared < open.length && open[shared]?.wrapper === wrappers[shared]) shared++
    open = open.slice(0, shared)
    for (const next of wrappers.slice(shared)) {
      const copy = emptyCopy(next.rule)
      ;(open.at(-1)?.copy ?? stylesheet).append(copy)
      open.push({wrapper: next, copy})
    }
    ;(open.at(-1)?.copy ?? stylesheet).append(node)
  }
}

/** A copy of a block rule without its children: the same prelude, with the same formatting. */
function emptyCopy(rule: BlockRule): BlockRule {
  return rule.type === 'rule'
    ? styleRule({selector: rule.selector, raws: {...rule.raws}})
    : atRule({name: rule.name, params: rule.params, raws: {...rule.raws}})
}

/** Whether a block has a `@layer` rule in it, at any depth. */
function containsLayer(container: Container): boolean {
  return container.some(
    (node) =>
      (node.type === 'atrule' && isLayerRule(node)) || (isBlockRule(node) && containsLayer(node)),
  )
}

function isLayerRule(rule: AtRule): boolean {
  return rule.name.toLowerCase() === 'layer'
}

function isBlockRule(node: ChildNode): node is BlockRule {
  return node.type === 'rule' || (node.type === 'atrule' && node.nodes !== undefined)
}

/** The parsed names of each `@layer` prelude seen, or `undefined` for one that doesn't parse. */
const layerNamesCache = new Map<string, string[][] | undefined>()

/**
 * The layer names a `@layer` prelude lists, as identifier segments (`a.b, c` is
 * `[['a', 'b'], ['c']]`), with escapes resolved and comments dropped, so `u\-tokens` and
 * `u-tokens` name the same layer and `a\,b` is one name. lightningcss parses them, as the
 * statement `@layer <prelude>;`: it tokenizes identifiers like a browser does, and rejects what a
 * browser rejects (`a b`, `1`, a trailing comma), which reads as `undefined` here. An empty
 * prelude, that of an anonymous block, has no names.
 */
function layerNames(prelude: string): string[][] | undefined {
  if (prelude.trim() === '') return []
  if (layerNamesCache.has(prelude)) return layerNamesCache.get(prelude)
  let names: string[][] | undefined
  try {
    transform({
      filename: 'layer.css',
      code: encoder.encode(`@layer ${prelude};`),
      visitor: {
        Rule: {
          'layer-statement'(rule) {
            names = rule.value.names
          },
        },
      },
    })
  } catch {
    names = undefined
  }
  layerNamesCache.set(prelude, names)
  return names
}

/**
 * The indentation of one nesting level in a pretty-printed stylesheet: what its first nested
 * node is indented by, or two spaces (what lightningcss uses) when nothing is nested with a line
 * break. A minified stylesheet has no line breaks in its whitespace, which {@link reindent}
 * leaves alone.
 */
function detectIndentUnit(stylesheet: Root): string {
  for (const node of stylesheet.nodes) {
    if (!isBlockRule(node)) continue
    const first = node.nodes?.[0]
    const indentation = /\n([ \t]*)$/.exec(first?.raws.before ?? '')?.[1]
    if (indentation !== undefined) return indentation
  }
  return '  '
}

/**
 * Indents every node for the depth it ends up at, since the layer's rules moved up a level and
 * the rules of a split block moved into copies of it. Whitespace without a line break, as in a
 * minified stylesheet, is kept. With line breaks, the result is what lightningcss prints: a rule
 * on a line of its own, with an empty line between sibling rules and none between declarations,
 * and a closing brace at the indentation of its rule.
 */
function reindent(stylesheet: Root, unit: string): void {
  function visit(container: Container, depth: number): void {
    container.each((node, index) => {
      const before = node.raws.before
      if (before?.includes('\n')) {
        const lineBreaks = node.type === 'decl' || index === 0 ? '\n' : '\n\n'
        node.raws.before = depth === 0 && index === 0 ? '' : `${lineBreaks}${unit.repeat(depth)}`
      }
      if (isBlockRule(node)) {
        if (node.raws.after?.includes('\n')) node.raws.after = `\n${unit.repeat(depth)}`
        visit(node, depth + 1)
      }
    })
  }
  visit(stylesheet, 0)
}
