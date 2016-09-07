import React, {PropTypes} from 'react'
import {StateLink, RouteScope} from '../../src'
import Product from './Product'
import User from './User'

class Main extends React.Component {
  render() {
    const {router} = this.context
    return (
      <div>
        <h1>Main</h1>
        <pre>{JSON.stringify(router.state, null, 2)}</pre>
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
          <StateLink state={{userId: 'me', product: {id: 55}}}>Show both product and profile</StateLink>
        </p>
        <p>
          <StateLink toIndex>Back to index</StateLink>
        </p>
      </div>
    )
  }
}

Main.contextTypes = {
  router: PropTypes.object
}
Main.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string
  }),
  onNavigate: PropTypes.func
}

export default Main