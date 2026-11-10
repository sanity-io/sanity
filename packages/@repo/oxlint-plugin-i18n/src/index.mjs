import {
  createTranslationVisitor,
  hasKey,
  optionsSchema,
  relativeFilename,
  resourcesFor,
} from './translations.mjs'

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

/**
 * Disallow reading a plugin's locale namespace from code outside that plugin.
 *
 * A plugin's namespace is only registered when the plugin is loaded. Code outside the plugin
 * (core components, form inputs, structure, the navbar) also renders in studios without it, and
 * then shows raw keys such as `presence.tooltip.one` instead of text. Strings that such code
 * needs belong in an always registered namespace (usually `studio`).
 *
 * Which namespaces are plugin-only, and which directories may read them, is configured in
 * `namespaces.mjs`. Code inside those directories can still render without the plugin (a
 * component that other areas import), so the rule is a backstop, not a proof.
 */
const noPluginNamespaceOutsidePlugin = {
  meta: {
    type: 'problem',
    docs: {
      description: "Disallow reading a plugin's locale namespace from outside that plugin",
    },
    messages: {
      outsidePlugin:
        "The '{{namespace}}' locale namespace is only registered by {{registeredBy}}, and this file is outside {{allowedIn}}. If it renders in a studio without that plugin, users see raw translation keys. Move the strings to an always registered namespace (eg 'studio'), or move the code into the plugin.",
    },
    schema: optionsSchema,
  },
  create(context) {
    const filename = relativeFilename(context)
    return createTranslationVisitor(context, {
      onNamespace({node, namespace, entry}) {
        if (!entry?.allowedIn) return
        if (entry.allowedIn.some((dir) => filename.startsWith(dir))) return
        context.report({
          node,
          messageId: 'outsidePlugin',
          data: {
            namespace,
            registeredBy: entry.registeredBy,
            allowedIn: entry.allowedIn.join(', '),
          },
        })
      },
    })
  },
}

/**
 * Disallow translation keys that do not exist in the namespace they are read from.
 *
 * i18next renders a missing key as the key itself, so a typo, a key moved to another bundle or
 * a key read with the wrong `t` ships as raw text. Keys are checked against the US English
 * resources listed in `namespaces.mjs`; plural and context variants (`key_one`, `key_other`)
 * count as the key itself when the call passes `count` or `context`. Only statically known keys
 * read through a `t` from `useTranslation()` in the same file are checked.
 */
const noMissingTranslationKey = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow translation keys that are missing from their namespace',
    },
    messages: {
      missingKey:
        "Translation key '{{key}}' does not exist in the '{{namespace}}' namespace ({{resources}}).",
      unknownNamespace:
        "Unknown locale namespace '{{namespace}}'. Add it to packages/@repo/oxlint-plugin-i18n/src/namespaces.mjs if it is real.",
    },
    schema: optionsSchema,
  },
  create(context) {
    const filename = relativeFilename(context)
    return createTranslationVisitor(context, {
      onNamespace({node, namespace, entry}) {
        if (!entry) context.report({node, messageId: 'unknownNamespace', data: {namespace}})
      },
      onKey({node, namespace, key, allowsVariants, entry}) {
        if (!entry) return
        const missingFrom = resourcesFor(entry, filename).filter(
          ({keys}) => !hasKey(keys, key, allowsVariants),
        )
        if (missingFrom.length === 0) return
        context.report({
          node,
          messageId: 'missingKey',
          data: {key, namespace, resources: missingFrom.map(({file}) => file).join(', ')},
        })
      },
    })
  },
}

export default {
  meta: {name: '@repo/oxlint-plugin-i18n'},
  rules: {
    'no-inline-translate-components': noInlineTranslateComponents,
    'no-missing-translation-key': noMissingTranslationKey,
    'no-plugin-namespace-outside-plugin': noPluginNamespaceOutsidePlugin,
  },
}
