import {route} from 'part:@sanity/base/router'
import React from 'react'

function MyTool(props) {
  return (
    <div>
      <h2>My Tool</h2>
    </div>
  )
}
export default {
  name: 'my-tool',
  icon: () => <div/>,
  router: route('/'),
  component: MyTool
}
