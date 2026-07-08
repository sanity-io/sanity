import {type BlockStyleRenderProps} from '@portabletext/editor'
import {useCallback, useMemo} from 'react'

import {type BlockStyleProps} from '../../../types'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'
import {Normal as FallbackComponent, TEXT_STYLES, TextContainer} from './textStyles'

type StyleProps = Pick<BlockStyleRenderProps, 'block' | 'children' | 'focused' | 'selected'>

export const Style = (props: StyleProps) => {
  const {block, focused, children, selected} = props
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const sanitySchemaType = schemaTypes.styles.find((type) => type.value === block.style)
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
    if (!sanitySchemaType) {
      // The value predates a schema change (for example a style that was
      // removed). Render as normal text instead of crashing.
      console.warn(`Could not find Sanity schema type for style: ${block.style}`)
      return (
        <FallbackComponent>
          <TextContainer>{children}</TextContainer>
        </FallbackComponent>
      )
    }
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
      // oxlint-disable-next-line react/react-compiler -- this is intentional and how the middleware components has to work
      <DefaultComponent {...componentProps}>{children}</DefaultComponent>
    )
  }, [DefaultComponent, block, children, focused, sanitySchemaType, selected])
}
