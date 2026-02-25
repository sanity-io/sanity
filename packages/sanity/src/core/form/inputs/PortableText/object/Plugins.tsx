import {htmlToBlocks} from '@portabletext/block-tools'
import {defineBehavior, raise} from '@portabletext/editor/behaviors'
import {BehaviorPlugin} from '@portabletext/editor/plugins'
import {MarkdownShortcutsPlugin} from '@portabletext/plugin-markdown-shortcuts'
import {OneLinePlugin} from '@portabletext/plugin-one-line'
import {PasteLinkPlugin} from '@portabletext/plugin-paste-link'
import {createDecoratorGuard, TypographyPlugin} from '@portabletext/plugin-typography'
import {type ArraySchemaType, type PortableTextBlock} from '@sanity/types'
import {type ComponentType, useMemo} from 'react'

import {useMiddlewareComponents} from '../../../../config/components/useMiddlewareComponents'
import {pickPortableTextEditorPluginsComponent} from '../../../form-components-hooks/picks'
import {type MarkdownConfig, type PortableTextPluginsProps} from '../../../types/blockProps'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'

const markdownConfig: MarkdownConfig = {
  boldDecorator: ({schema}) =>
    schema.decorators.find((decorator) => decorator.name === 'strong')?.name,
  codeDecorator: ({schema}) =>
    schema.decorators.find((decorator) => decorator.name === 'code')?.name,
  italicDecorator: ({schema}) =>
    schema.decorators.find((decorator) => decorator.name === 'em')?.name,
  strikeThroughDecorator: ({schema}) =>
    schema.decorators.find((decorator) => decorator.name === 'strike-through')?.name,
  defaultStyle: ({schema}) => schema.styles.find((style) => style.name === 'normal')?.name,
  blockquoteStyle: ({schema}) => schema.styles.find((style) => style.name === 'blockquote')?.name,
  headingStyle: ({schema, level}) =>
    schema.styles.find((style) => style.name === `h${level}`)?.name,
  orderedListStyle: ({schema}) => schema.lists.find((list) => list.name === 'number')?.name,
  unorderedListStyle: ({schema}) => schema.lists.find((list) => list.name === 'bullet')?.name,
}

export const PortableTextEditorPlugins = (props: {
  schemaType: ArraySchemaType<PortableTextBlock>
}) => {
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const isOneLineEditor = Boolean(schemaTypes.block.options?.oneLine)

  // Studio owns HTML paste deserialization so it can pass
  // unstable_whitespaceOnPasteMode from the Sanity schema config directly to
  // block-tools. This bypasses PTE's built-in HTML converter, which doesn't
  // have access to Sanity-specific schema options.
  const htmlPasteBehaviors = useMemo(
    () => [
      defineBehavior({
        on: 'deserialize.data',
        guard: ({snapshot, event}) => {
          if (event.mimeType !== 'text/html') {
            return false
          }

          const blocks = htmlToBlocks(event.data, schemaTypes.portableText, {
            keyGenerator: snapshot.context.keyGenerator,
            unstable_whitespaceOnPasteMode:
              schemaTypes.block.options?.unstable_whitespaceOnPasteMode,
          }) as Array<PortableTextBlock>

          if (blocks.length === 0) {
            return {
              type: 'deserialization.failure' as const,
              mimeType: 'text/html' as const,
              reason: 'No blocks deserialized',
            }
          }

          return {
            type: 'deserialization.success' as const,
            mimeType: 'text/html' as const,
            data: blocks,
          }
        },
        actions: [
          ({event}, deserializeEvent) => [
            raise({
              ...deserializeEvent,
              originEvent: event.originEvent,
            }),
          ],
        ],
      }),
    ],
    [schemaTypes.block.options?.unstable_whitespaceOnPasteMode, schemaTypes.portableText],
  )

  const componentProps = useMemo(
    (): PortableTextPluginsProps => ({
      plugins: {
        markdown: {
          config: markdownConfig,
        },
        pasteLink: {},
        typography: {
          guard: createDecoratorGuard({
            decorators: ({context}) =>
              context.schema.decorators.flatMap((decorator) =>
                decorator.name === 'code' ? [] : [decorator.name],
              ),
          }),
        },
      },
      renderDefault: RenderDefault,
    }),
    [],
  )

  const CustomComponent = props.schemaType.components?.portableText?.plugins as
    | ComponentType<PortableTextPluginsProps>
    | undefined

  return (
    <>
      <BehaviorPlugin behaviors={htmlPasteBehaviors} />
      {isOneLineEditor && (
        <>
          <OneLinePlugin />
          <BehaviorPlugin
            behaviors={[
              defineBehavior({
                on: 'insert.soft break',
                actions: [],
              }),
            ]}
          />
        </>
      )}
      {CustomComponent ? (
        <CustomComponent {...componentProps} />
      ) : (
        <RenderDefault {...componentProps} />
      )}
    </>
  )
}

function DefaultPortableTextEditorPlugins(props: Omit<PortableTextPluginsProps, 'renderDefault'>) {
  return (
    <>
      <DefaultMarkdownShortcutsPlugin {...props.plugins.markdown} />
      <DefaultPasteLinkPlugin {...props.plugins.pasteLink} />
      <DefaultTypographyPlugin {...props.plugins.typography} />
    </>
  )
}

function DefaultMarkdownShortcutsPlugin(
  incomingProps: PortableTextPluginsProps['plugins']['markdown'],
) {
  const props = incomingProps ?? {}

  if (!props.config) {
    const {enabled, config, ...markdownShortcutsPluginProps} = props

    if (enabled === false) {
      return null
    }

    return <MarkdownShortcutsPlugin {...markdownShortcutsPluginProps} />
  }

  const {orderedList, orderedListStyle, unorderedList, unorderedListStyle, ...restMarkdownConfig} =
    props.config

  return (
    <MarkdownShortcutsPlugin
      orderedList={orderedList ?? orderedListStyle}
      unorderedList={unorderedList ?? unorderedListStyle}
      {...restMarkdownConfig}
    />
  )
}

function DefaultPasteLinkPlugin(props: PortableTextPluginsProps['plugins']['pasteLink']) {
  const {enabled, ...pasteLinkPluginProps} = props ?? {}

  if (enabled === false) {
    return null
  }

  return <PasteLinkPlugin {...pasteLinkPluginProps} />
}

function DefaultTypographyPlugin(props: PortableTextPluginsProps['plugins']['typography']) {
  const {enabled, ...typographyPluginProps} = props ?? {}

  if (enabled === false) {
    return null
  }

  return <TypographyPlugin {...typographyPluginProps} />
}

export const RenderDefault = (props: Omit<PortableTextPluginsProps, 'renderDefault'>) => {
  const RenderPlugins = useMiddlewareComponents({
    defaultComponent: DefaultPortableTextEditorPlugins,
    pick: pickPortableTextEditorPluginsComponent,
  })
  // eslint-disable-next-line react-hooks/static-components -- this is intentional and how the middleware components has to work
  return <RenderPlugins {...props} />
}
