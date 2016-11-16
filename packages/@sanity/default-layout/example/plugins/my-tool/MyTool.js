import {route} from 'part:@sanity/base/router'
import React from 'react'

function MyTool(props) {
  return (
    <div>
      <h2>ZMy ZTool</h2>
    </div>
  )
}
export default {
  name: 'ztool',
  icon: () => <div/>,
  router: route('/'),
  component: MyTool
}
