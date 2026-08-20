import {expectTypeOf, test} from 'vitest'

import {
  type MarkdownConfig,
  type PortableTextPluginsProps,
  type _WithLegacyMarkdownArgs,
} from './blockProps'

test('old-shape callbacks destructuring the deprecated top-level `schema`/`level` are assignable to `MarkdownConfig`', () => {
  const config: MarkdownConfig = {
    // oxlint-disable-next-line no-deprecated -- pins that the deprecated top-level `schema` still typechecks
    boldDecorator: ({schema}) =>
      schema.decorators.find((decorator) => decorator.name === 'strong')?.name,
    // oxlint-disable-next-line no-deprecated -- pins that the deprecated top-level `schema`/`level` still typecheck
    headingStyle: ({schema, level}) =>
      schema.styles.find((style) => style.name === `h${level}`)?.name,
  }
  expectTypeOf(config).toExtend<MarkdownConfig>()
})

test('new-shape callbacks reading `context` are assignable to `MarkdownConfig`', () => {
  const config: MarkdownConfig = {
    boldDecorator: ({context}) =>
      context.schema.decorators.find((decorator) => decorator.name === 'strong')?.name,
  }
  expectTypeOf(config).toExtend<MarkdownConfig>()
})

test('`_WithLegacyMarkdownArgs` keeps accepting old-shape callbacks even once the plugin drops the deprecated params from its own types', () => {
  // Mimics `@portabletext/plugin-markdown-shortcuts` after it removes the deprecated
  // top-level `schema`/`level` fields: the callback args below carry only `context`
  // (and `props.level` for `headingStyle`). If the old-shape callbacks below still
  // typecheck against `_WithLegacyMarkdownArgs<PostRemovalMarkdownShortcutsPluginProps>`,
  // the deprecated fields are coming from Studio's own mapped type, not from whatever
  // the installed plugin version happens to still declare.
  type PostRemovalMarkdownShortcutsPluginProps = {
    boldDecorator?: (arg: {context: {schema: {decorators: {name: string}[]}}}) => string | undefined
    headingStyle?: (arg: {
      context: {schema: {styles: {name: string}[]}}
      props: {level: number}
    }) => string | undefined
    horizontalRuleObject?: (arg: {context: {schema: unknown}}) => {_type: string} | undefined
    linkObject?: (arg: {
      context: {schema: unknown}
      props: {href: string}
    }) => {_type: string} | undefined
  }

  const config: _WithLegacyMarkdownArgs<PostRemovalMarkdownShortcutsPluginProps> = {
    // oxlint-disable-next-line no-deprecated -- pins that the deprecated top-level `schema` still typechecks
    boldDecorator: ({schema}) =>
      schema.decorators.find((decorator) => decorator.name === 'strong')?.name,
    // oxlint-disable-next-line no-deprecated -- pins that the deprecated top-level `schema`/`level` still typecheck
    headingStyle: ({schema, level}) =>
      schema.styles.find((style) => style.name === `h${level}`)?.name,
  }
  expectTypeOf(config).toExtend<_WithLegacyMarkdownArgs<PostRemovalMarkdownShortcutsPluginProps>>()
})

test('plugins.markdown accepts spreading the incoming value and overriding `enabled`', () => {
  // A structural assertion misses this: the excess-property error only fires on
  // literal assignment, so the spread is replicated in a real `renderDefault` call.
  expectTypeOf((props: PortableTextPluginsProps) =>
    props.renderDefault({
      ...props,
      plugins: {
        ...props.plugins,
        markdown: {
          ...props.plugins.markdown,
          enabled: false,
        },
      },
    }),
  ).toBeFunction()
})
