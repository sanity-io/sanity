import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs, text, boolean, object} from 'part:@sanity/storybook/addons/knobs'
import ViewColumnIcon from 'part:@sanity/base/view-column-icon'
import Branding from './components/Branding'
import ToolSwitcher from './components/ToolSwitcher'
import NotFound from './components/NotFound'
import LoginStatus from './components/LoginStatus'
import Search from './components/SearchWidget'

storiesOf('Default layout')
  .addDecorator(withKnobs)
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
  .add('Search', () => {
    return (
      <div style={{backgroundColor: '#000', color: '#fff'}}>
        <Search
          inputValue={text('inputValue (prop)')}
          onInputChange={event => console.log('onInputChange', event)}
          isOpen={boolean('isOpen (prop)', false)}
          isSearching={boolean('isSearching (prop)')}
          renderItem={(i, index) => <div>Item</div>}
          hits={object('hits', [{index: 0, _id: 'id0', name: 'Test'}])}
        />
      </div>
    )
  })
  .add('Login Status', () => {
    return (
      <LoginStatus
        user={{name: 'John Doe', profileImage: 'https://randomuser.me/api/portraits/men/12.jpg'}}
        onLogout={() => alert('logout')}
      />
    )
  })
