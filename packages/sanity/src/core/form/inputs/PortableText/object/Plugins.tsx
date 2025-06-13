import {usePortableTextEditor} from '@portabletext/editor'
import {defineBehavior} from '@portabletext/editor/behaviors'
import {
  BehaviorPlugin,
  MarkdownPlugin,
  type MarkdownPluginConfig,
  OneLinePlugin,
} from '@portabletext/editor/plugins'
import {type ArraySchemaType, type PortableTextBlock} from '@sanity/types'
import {type ComponentType, useMemo} from 'react'

import {useMiddlewareComponents} from '../../../../config/components/useMiddlewareComponents'
import {pickPortableTextEditorPluginsComponent} from '../../../form-components-hooks/picks'
import {type PortableTextPluginsProps} from '../../../types/blockProps'

const markdownConfig: MarkdownPluginConfig = {
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
      plugins: {markdown: {config: markdownConfig}},
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

export const DefaultPortableTextEditorPlugins = (
  props: Omit<PortableTextPluginsProps, 'renderDefault'>,
) => {
  return <MarkdownPlugin config={props.plugins.markdown.config} />
}

export const RenderDefault = (props: Omit<PortableTextPluginsProps, 'renderDefault'>) => {
  const RenderPlugins = useMiddlewareComponents({
    defaultComponent: DefaultPortableTextEditorPlugins,
    pick: pickPortableTextEditorPluginsComponent,
  })
  return <RenderPlugins {...props} />
}
