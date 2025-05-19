import {MarkdownPlugin, MarkdownPluginConfig} from '@portabletext/editor/plugins'
import {ArraySchemaType, PortableTextBlock} from '@sanity/types'
import {ComponentType, useMemo} from 'react'
import {PtePluginsProps} from '../../../types/blockProps'
import {Stack, Text} from '@sanity/ui'
import {useMiddlewareComponents} from '../../../../config/components/useMiddlewareComponents'
import {pickPTEPluginsComponent} from '../../../form-components-hooks/picks'

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
  return (
    <>
      <Text size={0}>Markdown plugin</Text>
      <Text size={0}>Supported markdown:</Text>
      <Text size={0}>
        {JSON.stringify(
          Object.entries(props.markdownPluginProps.config)
            .filter(([key, value]) => value)
            .map(([key]) => key),
        )}
      </Text>
      <MarkdownPlugin config={props.markdownPluginProps.config} />
    </>
  )
}

export const RenderDefault = (props: Omit<PtePluginsProps, 'renderDefault'>) => {
  const RenderPlugins = useMiddlewareComponents({
    defaultComponent: DefaultPTEPlugins,
    pick: pickPTEPluginsComponent,
  })
  return (
    <Stack space={3} paddingBottom={3} style={{border: '1px solid red'}}>
      <Text size={1} weight="medium">
        Render default PTE plugins
      </Text>
      <RenderPlugins {...props} />
    </Stack>
  )
}
