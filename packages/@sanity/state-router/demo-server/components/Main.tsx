import {Router} from '../../src/components/types'
import * as React from 'react'
import {StateLink, Link, RouteScope, withRouterHOC} from '../../src/components'
import Product from './Product'
import User from './User'

type Props = {
  router: Router
}

export default withRouterHOC((props: Props) => {
  const {router} = props
  return (
    <div>
      <h1>Main</h1>
      <h3>Current router state (global):</h3>
      <pre>
        <code>{JSON.stringify(router.state, null, 2)}</code>
      </pre>
      {router.state.product && (
        <RouteScope scope="product">
          <Product id={router.state.product.id} />
        </RouteScope>
      )}
      {router.state.userId && <User id={router.state.userId} />}
      <p>
        <StateLink state={{product: {id: 55}}}>Go to product #55</StateLink>
      </p>
      <p>
        <StateLink state={{userId: 'me'}}>Show profile</StateLink>
      </p>
      <p>
        <StateLink state={{product: {id: 55, userId: 'me'}}}>
          Show both product and profile
        </StateLink>
      </p>
      <p>
        <Link href={`/foo/bar/${Math.random().toString(32).substring(2)}`}>Invalid</Link>
      </p>
      <p>
        <StateLink toIndex>Back to index</StateLink>
      </p>
    </div>
  )
})
