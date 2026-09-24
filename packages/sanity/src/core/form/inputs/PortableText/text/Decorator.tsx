import {type DecoratorRenderProps, useEditor} from '@portabletext/editor'
import {getSanitySubSchema} from '@portabletext/sanity-bridge'
import {type Path} from '@sanity/types'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {toString as pathToString} from '@sanity/util/paths'
import {type ElementType, type ReactNode, useCallback, useMemo} from 'react'

import {type BlockDecoratorProps} from '../../../types/blockProps'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'
import {warnOnce} from '../warnOnce'
import {TEXT_DECORATOR_TAGS} from './constants'
import {root} from './Decorator.css'

type DecoratorProps = DecoratorRenderProps & {portableTextPath: Path}

// Reads the scheme where it renders: a custom decorator can wrap `renderDefault()` in a `Card`
// with a different scheme, and the mark styling has to follow that one
function DecoratorRoot(props: {as: ElementType; children: ReactNode; decorator: string}) {
  const {as: Tag, children, decorator} = props
  const {color} = useThemeV2()

  return (
    <Tag className={root[color._dark ? 'dark' : 'light']} data-mark={decorator}>
      {children}
    </Tag>
  )
}

export function Decorator(props: DecoratorProps) {
  const {decorator, focused, selected, children, path, portableTextPath} = props
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const editor = useEditor()
  // Resolve against the position's sub-schema, not the merged root: a
  // decorator declared only inside a container (or missing from it) must
  // resolve the way the annotation render callback already does.
  const sanitySchemaType = getSanitySubSchema(
    schemaTypes.portableText,
    editor.getSnapshot().context.value,
    path,
  ).decorators.find((type) => type.value === decorator)
  // Custom decorators have no tag in the map and render as a `span`
  const Tag: ElementType = TEXT_DECORATOR_TAGS[decorator] ?? 'span'
  const CustomComponent = sanitySchemaType?.component
  const DefaultComponent = useCallback(
    (defaultComponentProps: BlockDecoratorProps) => {
      return (
        <DecoratorRoot as={Tag} decorator={decorator}>
          {defaultComponentProps.children}
        </DecoratorRoot>
      )
    },
    [Tag, decorator],
  )
  return useMemo(() => {
    if (!sanitySchemaType) {
      // The value predates a schema change (for example a decorator that was
      // removed). Render the children without the mark styling instead of
      // crashing.
      warnOnce(
        `Could not find schema type for decorator: ${decorator} at ${pathToString(portableTextPath.concat(path))}`,
      )
      return <>{children}</>
    }
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
  }, [
    CustomComponent,
    DefaultComponent,
    children,
    focused,
    path,
    portableTextPath,
    sanitySchemaType,
    selected,
    decorator,
  ])
}
