import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import ViewColumnIcon from 'part:@sanity/base/view-column-icon'
import Branding from './components/Branding'
import ToolSwitcher from './components/ToolSwitcher'
import NotFound from './components/NotFound'
import LoginStatus from './components/LoginStatus'
// import Search from './components/Search'

storiesOf('Default layout')
  .add('Branding', () => {
    return <Branding />
  })
  .add('Toolswitcher', () => {
    return (
      <ToolSwitcher
        onSwitchTool={event => {
          console.log('onSwitchTool()', event)
        }}
        tools={[
          {
            name: 'Desk tool',
            icon: ViewColumnIcon
          }
        ]}
      />
    )
  })
  .add('Not Found', () => {
    return <NotFound />
  })
  // .add('Search', () => {
  //   return <Search />
  // })
  .add('Login Status', () => {
    return (
      <LoginStatus
        user={{name: 'John Doe', profileImage: 'https://randomuser.me/api/portraits/men/12.jpg'}}
        onLogout={() => alert('logout')}
      />
    )
  })
