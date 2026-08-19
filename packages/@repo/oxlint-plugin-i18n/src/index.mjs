/**
 * In-repo oxlint jsPlugin with i18n rules that complement the published
 * `@sanity/eslint-plugin-i18n` plugin. Loaded from `.oxlintrc.json` via the `jsPlugins`
 * entry named `@repo/i18n`.
 */

/**
 * Disallow defining components inline in the `components` prop of `<Translate>`.
 *
 * An inline function gets a new component identity on every render, so React unmounts and
 * remounts its subtree each time (losing state and DOM) — the same problem
 * `react/no-unstable-nested-components` guards against. `<Translate>` supports stable,
 * module-scope components: data they need is forwarded through the `componentProps` prop,
 * and plain HTML wrappers can be expressed as string mappings (eg `{Code: 'code'}`).
 *
 * This rule only sees object literals written directly in the JSX attribute. Component maps
 * built during render some other way (eg with `useMemo`) are not detected — hoist those to
 * module scope too.
 */
const noInlineTranslateComponents = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow inline component definitions in the components prop of Translate',
    },
    messages: {
      noInline:
        "Do not define components inline in the `components` prop of `<Translate>` - each render creates a new component identity, remounting the subtree. Hoist the component to module scope and pass data through `componentProps`, or map plain HTML wrappers as strings (eg `{Code: 'code'}`).",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.name !== 'components') return

        const elementName = node.parent?.name
        if (elementName?.type !== 'JSXIdentifier' || elementName.name !== 'Translate') return

        if (node.value?.type !== 'JSXExpressionContainer') return
        const expression = node.value.expression
        if (expression?.type !== 'ObjectExpression') return

        for (const property of expression.properties) {
          if (property.type !== 'Property') continue
          const value = property.value
          if (value.type === 'ArrowFunctionExpression' || value.type === 'FunctionExpression') {
            context.report({node: value, messageId: 'noInline'})
          }
        }
      },
    }
  },
}

export default {
  meta: {name: '@repo/oxlint-plugin-i18n'},
  rules: {
    'no-inline-translate-components': noInlineTranslateComponents,
  },
}
