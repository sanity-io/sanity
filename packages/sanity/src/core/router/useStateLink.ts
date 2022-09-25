import React, {useMemo} from 'react'
import {useRouter} from './useRouter'
import {useLink} from './useLink'

const EMPTY_STATE = {}

/**
 * @public
 */
export function useStateLink(props: {
  onClick?: React.MouseEventHandler<HTMLElement>
  replace?: boolean
  state?: Record<string, unknown>
  target?: string
  toIndex?: boolean
}): {
  onClick: React.MouseEventHandler<HTMLElement>
  href: string
} {
  const {onClick: onClickProp, replace, state, target, toIndex = false} = props

  if (state && toIndex) {
    throw new Error('Passing both `state` and `toIndex={true}` as props to StateLink is invalid')
  }

  if (!state && !toIndex) {
    // eslint-disable-next-line no-console
    console.error(
      new Error(
        'No state passed to StateLink. If you want to link to an empty state, its better to use the the `toIndex` property'
      )
    )
  }

  const {resolvePathFromState} = useRouter()

  const href = useMemo(
    () => resolvePathFromState(toIndex ? EMPTY_STATE : state || EMPTY_STATE),
    [resolvePathFromState, state, toIndex]
  )

  const {onClick} = useLink({href, onClick: onClickProp, replace, target})

  return {onClick, href}
}
