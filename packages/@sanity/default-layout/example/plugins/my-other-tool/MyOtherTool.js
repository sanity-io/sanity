import {route, StateLink} from 'part:@sanity/base/router'
import React, {PropTypes} from 'react'

class WithRouterState extends React.Component {
  static propTypes = {
    children: PropTypes.func
  }
  static contextTypes = {
    router: PropTypes.object
  }

  render() {
    const {state} = this.context.router
    return this.props.children(state)
  }
}

function MyOtherTool(props) {
  return (
    <div>
      <h2>Other Tool, I can have router state</h2>
      <WithRouterState>
        {state => (
          <div>
            This is my state:
            <pre>{JSON.stringify(state)}</pre>
          </div>
        )}
      </WithRouterState>
      <p>
        <StateLink toIndex>Go to index</StateLink>
      </p>
      <p>
        <StateLink state={{foo: 'bar', rand: Math.random()}}>Click me</StateLink>
      </p>
    </div>
  )
}
export default {
  name: 'other-tool',
  icon: () => <div/>,
  router: route('/', route('/:foo/:rand')),
  component: MyOtherTool
}
