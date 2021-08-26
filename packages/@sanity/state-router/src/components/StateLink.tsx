import React, {ForwardedRef, forwardRef, useContext} from 'react'
import {RouterContext} from '../RouterContext'
import Link from './Link'

const EMPTY_STATE = {}

interface Props {
  state?: Record<string, unknown>
  toIndex?: boolean
}

const StateLink = forwardRef(function StateLink(
  props: Props & React.HTMLProps<HTMLAnchorElement>,
  ref: ForwardedRef<HTMLAnchorElement>
) {
  const {state, toIndex = false, ...rest} = props
  const routerContext = useContext(RouterContext)

  if (!routerContext) throw new Error('StateLink: missing context value')

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

  const nextState = toIndex ? EMPTY_STATE : state || EMPTY_STATE

  return <Link {...rest} href={routerContext.resolvePathFromState(nextState)} ref={ref} />
})

export default StateLink
