import {route} from 'part:@sanity/base/router'
import React from 'react'
function MyOtherTool(props) {
  return (
    <div>
      <h2>Other Tool</h2>
    </div>
  )
}
export default {
  name: 'other-tool',
  icon: () => <div/>,
  router: route('/'),
  component: MyOtherTool
}
