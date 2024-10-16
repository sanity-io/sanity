import {useMemo} from 'react'

import {type NavbarProps} from '../../config'
import {ReleasesNav} from './ReleasesNav'

export const ReleasesStudioNavbar = (props: NavbarProps) => {
  const actions = useMemo(
    (): NavbarProps['__internal_actions'] => [
      {
        location: 'topbar',
        name: 'releases-topbar',
        render: ReleasesNav,
      },
      ...(props?.__internal_actions || []),
    ],
    [props?.__internal_actions],
  )

  return props.renderDefault({
    ...props,
    // eslint-disable-next-line camelcase
    __internal_actions: actions,
  })
}
