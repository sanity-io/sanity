import {type BlockStyleRenderProps} from '@portabletext/editor'
import {useCallback, useMemo} from 'react'

import {type BlockStyleProps} from '../../../types'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'
import {Normal as FallbackComponent, TEXT_STYLES, TextContainer} from './textStyles'

export const Style = (props: BlockStyleRenderProps) => {
  const {block, focused, children, selected, schemaType} = props
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const sanitySchemaType = schemaTypes.styles.find((type) => type.value === schemaType.value)
  if (!sanitySchemaType) {
    // This should never happen
    throw new Error(`Could not find Sanity schema type for style: ${schemaType.value}`)
  }
  const DefaultComponentWithFallback = useMemo(
    () =>
      (block.style && TEXT_STYLES[block.style] ? TEXT_STYLES[block.style] : TEXT_STYLES[0]) ||
      FallbackComponent,
    [block.style],
  )

  const DefaultComponent = useCallback(
    (defaultComponentProps: BlockStyleProps) => {
      return (
        <DefaultComponentWithFallback>
          <TextContainer data-testid={`text-style--${block.style}`}>
            {defaultComponentProps.children}
          </TextContainer>
        </DefaultComponentWithFallback>
      )
    },
    [DefaultComponentWithFallback, block.style],
  )

  return useMemo(() => {
    const CustomComponent = sanitySchemaType.component
    const {title, value} = sanitySchemaType
    const componentProps = {
      block,
      focused,
      renderDefault: DefaultComponent,
      schemaType: sanitySchemaType,
      selected,
      title,
      value,
    }
    return CustomComponent ? (
      <CustomComponent {...componentProps}>{children}</CustomComponent>
    ) : (
      // eslint-disable-next-line react-hooks/static-components -- this is intentional and how the middleware components has to work
      <DefaultComponent {...componentProps}>{children}</DefaultComponent>
    )
  }, [DefaultComponent, block, children, focused, sanitySchemaType, selected])
}
