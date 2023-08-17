import React, {useCallback, useMemo} from 'react'
import styled from 'styled-components'
import {BlockDecoratorRenderProps} from '@sanity/portable-text-editor'
import {BlockDecoratorProps} from '../../../types'
import {TEXT_DECORATOR_TAGS} from './constants'

const Root = styled.span`
  /* Make sure the annotation styling is visible */
  &[data-mark='code'] {
    mix-blend-mode: multiply;
    color: inherit;
  }
`

export function Decorator(props: BlockDecoratorRenderProps) {
  const {value, focused, selected, children, schemaType} = props
  const tag = TEXT_DECORATOR_TAGS[value]
  const CustomComponent = schemaType.component
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
      schemaType,
      selected,
      title: schemaType.title,
      value,
    }
    return CustomComponent ? (
      <CustomComponent {...componentProps}>{children}</CustomComponent>
    ) : (
      <DefaultComponent {...componentProps}>{children}</DefaultComponent>
    )
  }, [CustomComponent, DefaultComponent, children, focused, schemaType, selected, value])
}
