import {type BlockDecoratorRenderProps, useEditor} from '@portabletext/editor'
import {getSanitySubSchema} from '@portabletext/sanity-bridge'
import {type Theme} from '@sanity/ui'
import {toString as pathToString} from '@sanity/util/paths'
import {useCallback, useMemo} from 'react'
import {css, styled} from 'styled-components'

import {type BlockDecoratorProps} from '../../../types'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'
import {warnOnce} from '../warnOnce'
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
  const {value, focused, selected, children, path, schemaType} = props
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const editor = useEditor()
  // Resolve against the position's sub-schema, not the merged root: a
  // decorator declared only inside a container (or missing from it) must
  // resolve the way the annotation render callback already does.
  const sanitySchemaType = getSanitySubSchema(
    schemaTypes.portableText,
    editor.getSnapshot().context.value,
    path,
  ).decorators.find((type) => type.value === schemaType.value)
  const tag = TEXT_DECORATOR_TAGS[value]
  const CustomComponent = sanitySchemaType?.component
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
    if (!sanitySchemaType) {
      // The value predates a schema change (for example a decorator that was
      // removed). Render the children without the mark styling instead of
      // crashing.
      warnOnce(`Could not find schema type for decorator: ${value} at ${pathToString(path)}`)
      return <>{children}</>
    }
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
      // oxlint-disable-next-line react/react-compiler -- this is intentional and how the middleware components has to work
      <DefaultComponent {...componentProps}>{children}</DefaultComponent>
    )
  }, [
    CustomComponent,
    DefaultComponent,
    children,
    focused,
    path,
    sanitySchemaType,
    selected,
    value,
  ])
}
