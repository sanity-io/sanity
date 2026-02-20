import {type BlockDecoratorRenderProps} from '@portabletext/editor'
import {type Theme} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {css, styled} from 'styled-components'

import {type BlockDecoratorProps} from '../../../types'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'
import {TEXT_DECORATOR_TAGS} from './constants'

const Root = styled.span(({theme}: {theme: Theme}) => {
  const isDark = theme.sanity.color.dark

  return css`
    /* Make sure the annotation styling is visible */
    &[data-mark='code'] {
      color: inherit;
      mix-blend-mode: ${isDark ? 'screen' : 'multiply'};
    }
  `
})

export function Decorator(props: BlockDecoratorRenderProps) {
  const {value, focused, selected, children, schemaType} = props
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const sanitySchemaType = schemaTypes.decorators.find((type) => type.value === schemaType.value)
  if (!sanitySchemaType) {
    // This should never happen
    throw new Error(`Could not find Sanity schema type for decorator: ${schemaType.value}`)
  }
  const tag = TEXT_DECORATOR_TAGS[value]
  const CustomComponent = sanitySchemaType.component
  const DefaultComponent = useCallback(
    (defaultComponentProps: BlockDecoratorProps) => {
      return (
        <Root as={tag} data-mark={value}>
          {defaultComponentProps.children}
        </Root>
      )
    },
    [tag, value],
  )
  return useMemo(() => {
    const componentProps = {
      focused,
      renderDefault: DefaultComponent,
      schemaType: sanitySchemaType,
      selected,
      title: sanitySchemaType.title,
      value,
    }
    return CustomComponent ? (
      <CustomComponent {...componentProps}>{children}</CustomComponent>
    ) : (
      // eslint-disable-next-line react-hooks/static-components -- this is intentional and how the middleware components has to work
      <DefaultComponent {...componentProps}>{children}</DefaultComponent>
    )
  }, [CustomComponent, DefaultComponent, children, focused, sanitySchemaType, selected, value])
}
