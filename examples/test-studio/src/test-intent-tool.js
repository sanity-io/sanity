import React from 'react'
import {route, withRouterHOC} from 'part:@sanity/base/router'

export default {
  router: route('/:type/:id'),
  canHandleIntent(intentName, params) {
    return (intentName === 'edit' && params.id) || (intentName === 'create' && params.type)
  },
  getIntentState(intentName, params) {
    return {
      type: params.type || '*',
      id: params.id,
    }
  },
  title: 'Test intent',
  name: 'test-intent',
  component: withRouterHOC((props) => (
    <div style={{padding: 10}}>
      <h2>Test intent precedence</h2>
      If you click an intent link (e.g. from search results) while this tool is open, it should be
      opened here.
      <pre>{JSON.stringify(props.router.state, null, 2)}</pre>
    </div>
  )),
}
