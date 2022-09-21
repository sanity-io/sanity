import React, {forwardRef} from 'react'
import * as PathUtils from '@sanity/util/paths'
import {Path, SanityDocument} from '@sanity/types'
import withDocument from './withDocument'
import withValuePath from './withValuePath'

interface WithParentProps<ParentType extends unknown = unknown> {
  parent: ParentType
}

function getParent(valuePath, document) {
  return PathUtils.get(document, valuePath.slice(0, -1))
}

export default function withParent<T extends WithParentProps = WithParentProps>(
  ComposedComponent: React.ComponentType<T>
) {
  return withDocument(
    withValuePath(
      forwardRef(function WithParentComponent(
        props: T & {document: SanityDocument; getValuePath: () => Path},
        ref
      ) {
        const {document, getValuePath, ...rest} = props
        return React.createElement(ComposedComponent, ({
          ...rest,
          ref,
          parent: getParent(getValuePath(), document),
        } as unknown) as T)
      })
    )
  )
}
