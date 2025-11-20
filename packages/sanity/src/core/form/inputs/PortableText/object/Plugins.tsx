import {usePortableTextEditor} from '@portabletext/editor'
import {defineBehavior} from '@portabletext/editor/behaviors'
import {BehaviorPlugin} from '@portabletext/editor/plugins'
import {MarkdownShortcutsPlugin} from '@portabletext/plugin-markdown-shortcuts'
import {OneLinePlugin} from '@portabletext/plugin-one-line'
import {createDecoratorGuard, TypographyPlugin} from '@portabletext/plugin-typography'
import {type ArraySchemaType, type PortableTextBlock} from '@sanity/types'
import {type ComponentType, useMemo} from 'react'

import {useMiddlewareComponents} from '../../../../config/components/useMiddlewareComponents'
import {pickPortableTextEditorPluginsComponent} from '../../../form-components-hooks/picks'
import {type MarkdownConfig, type PortableTextPluginsProps} from '../../../types/blockProps'

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
  const editor = usePortableTextEditor()
  const isOneLineEditor = Boolean(editor.schemaTypes.block.options?.oneLine)

  const componentProps = useMemo(
    (): PortableTextPluginsProps => ({
      plugins: {
        markdown: {
          config: markdownConfig,
        },
        typography: {
          enabled: false,
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
