import React, {PropTypes} from 'react'
import StateLink from '../../src/components/StateLink'
import IntentLink from '../../src/components/IntentLink'

export default class Product extends React.Component {
  static propTypes = {
    id: PropTypes.string
  }
  render() {
    const {id} = this.props
    const nextProductId = Math.random().toString(32).substring(2)
    return (
      <div>
        <h1>Showing a lot of information about product #{id}</h1>
        <StateLink state={{id, detailView: 'details'}}>View more details</StateLink>
        <p>
          <StateLink state={{id: nextProductId}}>Go to product #{nextProductId}</StateLink>
        </p>
        This is an intentlink:
        <IntentLink intent="open" params={{type: 'product', id: 'foo'}}>
          Open Foo
        </IntentLink>
        <p>
          <StateLink toIndex>Up…</StateLink>
        </p>
      </div>
    )
  }
}
