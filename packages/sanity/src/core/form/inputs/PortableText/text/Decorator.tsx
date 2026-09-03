import {type DecoratorRenderProps} from '@portabletext/editor'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type ElementType, useCallback, useMemo} from 'react'

import {type BlockDecoratorProps} from '../../../types/blockProps'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'
import {TEXT_DECORATOR_TAGS} from './constants'
import {root} from './Decorator.css'

export function Decorator(props: DecoratorRenderProps) {
  const {decorator, focused, selected, children} = props
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const {color} = useThemeV2()
  const sanitySchemaType = schemaTypes.decorators.find((type) => type.value === decorator)
  if (!sanitySchemaType) {
    // This should never happen
    throw new Error(`Could not find Sanity schema type for decorator: ${decorator}`)
  }
  // Custom decorators have no tag in the map and render as a `span`
  const Tag: ElementType = TEXT_DECORATOR_TAGS[decorator] ?? 'span'
  // Make sure the annotation styling is visible
  const rootClassName = root[color._dark ? 'dark' : 'light']
  const CustomComponent = sanitySchemaType.component
  const DefaultComponent = useCallback(
    (defaultComponentProps: BlockDecoratorProps) => {
      return (
        <Tag className={rootClassName} data-mark={decorator}>
          {defaultComponentProps.children}
        </Tag>
      )
    },
    [Tag, decorator, rootClassName],
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
