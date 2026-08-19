import {type BlockDecoratorRenderProps} from '@portabletext/editor'
import {type Theme} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {css, styled} from 'styled-components'

import {type BlockDecoratorProps} from '../../../types/blockProps'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'
import {TEXT_DECORATOR_TAGS} from './constants'

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
const Root = styled.span(({theme}: {theme: Theme}) => {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const isDark = theme.sanity.color.dark

  return css`
    /* Make sure the annotation styling is visible */
    &[data-mark='code'] {
      color: inherit;
      mix-blend-mode: ${isDark ? 'screen' : 'multiply'};
    }
  `
})

// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export function Decorator(props: BlockDecoratorRenderProps) {
  const {value, focused, selected, children, schemaType} = props
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const sanitySchemaType = schemaTypes.decorators.find((type) => type.value === schemaType.name)
  if (!sanitySchemaType) {
    // This should never happen
    throw new Error(`Could not find Sanity schema type for decorator: ${schemaType.name}`)
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
      // oxlint-disable-next-line react/static-components -- this is intentional and how the middleware components has to work
      <DefaultComponent {...componentProps}>{children}</DefaultComponent>
    )
  }, [CustomComponent, DefaultComponent, children, focused, sanitySchemaType, selected, value])
}
