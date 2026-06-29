import {type ReactNode} from 'react'
import {PortableTextRootMembersContext} from 'sanity/_singletons'

import {type PortableTextRootMembersContextValue} from './PortableTextRootMembersContextValue'

/**
 * Provides the root form-store members for the surrounding Portable Text
 * input, along with the render callbacks and input path needed to build
 * `<FormInput>` elements for any resolved nested member on demand.
 *
 * Replaces the eager flat-list provider. Consumers query via
 * `usePortableTextMemberItem(path)` or `useOpenPortableTextMember()`,
 * each of which walks the form-store tree lazily — depth-agnostic by
 * construction.
 *
 * @internal
 */
export function PortableTextRootMembersProvider(props: {
  value: PortableTextRootMembersContextValue
  children: ReactNode
}) {
  return (
    <PortableTextRootMembersContext.Provider value={props.value}>
      {props.children}
    </PortableTextRootMembersContext.Provider>
  )
}
