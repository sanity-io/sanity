import React from 'react'
import StateLink from '../../src/components/StateLink'
import IntentLink from '../../src/components/IntentLink'
import WithRouter from '../../src/components/WithRouter'
import NeverUpdate from './NeverUpdate'

export default class Product extends React.Component<{id: string}> {
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
          <WithRouter>
            {(router) => (
              <button
                onClick={() =>
                  router.navigateIntent('open', {
                    type: 'product',
                    id: 'foobar',
                  })
                }
              >
                Click to programmatically navigate to intent <b>open:</b> product foobar
              </button>
            )}
          </WithRouter>
        </p>
        <WithRouter>{(router) => <pre>{JSON.stringify(router.state)}</pre>}</WithRouter>
        <p>
          <StateLink toIndex>Up…</StateLink>
        </p>
        <div>
          <NeverUpdate />
        </div>
      </div>
    )
  }
}
