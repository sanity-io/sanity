import {Router} from '../../src/components/types'
import * as React from 'react'
import withRouterHOC from '../../src/components/withRouterHOC'

type Props = {
  router: Router
}

export default withRouterHOC((props: Props) => {
  const {router} = props
  return (
    <div>
      <h1>My parent never updates. Should still get router state updates.</h1>
      <h3>Current router state (scoped):</h3>
      <pre>
        <code>{JSON.stringify(router.state, null, 2)}</code>
      </pre>
    </div>
  )
})
