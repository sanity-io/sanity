/* eslint-disable react/display-name, react/no-multi-comp */
import {route} from 'part:@sanity/base/router'
import React from 'react'

function MyTool(props) {
  return <div>This is a tool</div>
}

export default {
  name: 'my-tool',
  title: 'My Tool',
  icon: () => <div />,
  router: route('/'),
  component: MyTool
}
