import React, {forwardRef} from 'react'
import {Path} from '@sanity/types'
import {useFormBuilder} from '../useFormBuilder'

export interface WithValuePathProps {
  getValuePath: () => Path
}

export function withValuePath<T extends WithValuePathProps = WithValuePathProps>(
  ComposedComponent: React.ComponentType<T>
) {
  const WithValuePath = forwardRef(function WithValuePath(
    props: Omit<T, 'getValuePath'>,
    ref: React.ForwardedRef<any>
  ) {
    const {getValuePath} = useFormBuilder()

    return (
      <ComposedComponent
        ref={ref}
        {...{getValuePath: getValuePath as WithValuePathProps['getValuePath']}}
        {...(props as T)}
      />
    )
  })

  WithValuePath.displayName = `withValuePath(${
    ComposedComponent.displayName || ComposedComponent.name
  })`

  return WithValuePath
}
