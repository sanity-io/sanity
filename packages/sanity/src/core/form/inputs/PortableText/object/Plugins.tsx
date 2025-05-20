import {MarkdownPlugin, type MarkdownPluginConfig} from '@portabletext/editor/plugins'
import {type ArraySchemaType, type PortableTextBlock} from '@sanity/types'
import {type ComponentType, useMemo} from 'react'

import {useMiddlewareComponents} from '../../../../config/components/useMiddlewareComponents'
import {pickPTEPluginsComponent} from '../../../form-components-hooks/picks'
import {type PtePluginsProps} from '../../../types/blockProps'

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

export const PTEPlugins = (props: {schemaType: ArraySchemaType<PortableTextBlock>}) => {
  const componentProps = useMemo(
    (): PtePluginsProps => ({
      ...props,
      markdownPluginProps: {config: markdownConfig},
      renderDefault: RenderDefault,
    }),
    [props],
  )

  const CustomComponent = props.schemaType.components?.ptePlugins as
    | ComponentType<PtePluginsProps>
    | undefined

  return CustomComponent ? (
    <CustomComponent {...componentProps} />
  ) : (
    <RenderDefault {...componentProps} />
  )
}

export const DefaultPTEPlugins = (props: Omit<PtePluginsProps, 'renderDefault'>) => {
  return <MarkdownPlugin config={props.markdownPluginProps.config} />
}

export const RenderDefault = (props: Omit<PtePluginsProps, 'renderDefault'>) => {
  const RenderPlugins = useMiddlewareComponents({
    defaultComponent: DefaultPTEPlugins,
    pick: pickPTEPluginsComponent,
  })
  return <RenderPlugins {...props} />
}
