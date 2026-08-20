import {type DecoratorRenderProps} from '@portabletext/editor'
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

export function Decorator(props: DecoratorRenderProps) {
  const {decorator, focused, selected, children} = props
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const sanitySchemaType = schemaTypes.decorators.find((type) => type.value === decorator)
  if (!sanitySchemaType) {
    // This should never happen
    throw new Error(`Could not find Sanity schema type for decorator: ${decorator}`)
  }
  const tag = TEXT_DECORATOR_TAGS[decorator]
  const CustomComponent = sanitySchemaType.component
  const DefaultComponent = useCallback(
    (defaultComponentProps: BlockDecoratorProps) => {
      return (
        <Root as={tag} data-mark={decorator}>
          {defaultComponentProps.children}
        </Root>
      )
    },
    [tag, decorator],
  )
  return useMemo(() => {
    const componentProps = {
      focused,
      renderDefault: DefaultComponent,
      schemaType: sanitySchemaType,
      selected,
      title: sanitySchemaType.title,
      value: decorator,
    }
    return CustomComponent ? (
      <CustomComponent {...componentProps}>{children}</CustomComponent>
    ) : (
      // oxlint-disable-next-line react/static-components -- this is intentional and how the middleware components has to work
      <DefaultComponent {...componentProps}>{children}</DefaultComponent>
    )
  }, [CustomComponent, DefaultComponent, children, focused, sanitySchemaType, selected, decorator])
}
