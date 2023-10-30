import {Tab as UITab, TabProps as UITabProps} from '@sanity/ui'
import React from 'react'

/** @internal */
export interface TabProps extends Omit<UITabProps, 'icon' | 'padding' | 'fontSize'> {
  size?: 'small'
  ref: React.Ref<HTMLButtonElement>
}

/**
 * Studio UI <Tab>.
 *
 * Studio UI components are opinionated `@sanity/ui` components meant for internal use only.
 * Props and options are intentionally limited to ensure consistency and ease of use.
 *
 * @internal
 */
export const Tab = ({size, ...rest}: TabProps) => {
  if (size === 'small') {
    return <UITab padding={2} {...rest} />
  }

  return <UITab {...rest} padding={4} />
}
