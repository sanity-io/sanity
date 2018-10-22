import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs, text, boolean, object, select, color} from 'part:@sanity/storybook/addons/knobs'
import ViewColumnIcon from 'part:@sanity/base/view-column-icon'
import Branding from './components/Branding'
import ToolSwitcherWidget from './components/ToolSwitcherWidget'
import NotFound from './components/NotFound'
import LoginStatus from './components/LoginStatus'
import Search from './components/SearchWidget'
import ToolSwitcherItem from './components/ToolSwitcherItem'
import NavBarStyles from './components/styles/NavBar.css'
import DefaultLayoutStyles from './components/styles/DefaultLayout.css'

storiesOf('Default layout')
  .addDecorator(withKnobs)
  .add('Branding', () => {
    return (
      <div className={DefaultLayoutStyles.navBar}>
        <div className={NavBarStyles.root}>
          <div className={NavBarStyles.branding}>
            <Branding />
          </div>
        </div>
      </div>
    )
  })
  .add('Toolswitcher', () => {
    return (
      <div className={DefaultLayoutStyles.navBar}>
        <div className={NavBarStyles.root}>
          <div className={NavBarStyles.toolSwitcher}>
            <ToolSwitcherWidget
              onSwitchTool={event => console.log('onSwitchTool()', event)}
              tools={[
                {
                  name: 'Desk tool',
                  icon: ViewColumnIcon
                },
                {
                  name: 'Desk tool 2',
                  icon: ViewColumnIcon
                },
                {
                  name: 'Desk tool 3',
                  icon: ViewColumnIcon
                }
              ]}
              renderItem={tool => <ToolSwitcherItem title={tool.name} icon={tool.icon} />}
            />
          </div>
        </div>
      </div>
    )
  })
  .add('ToolSwitcherItem', () => {
    return (
      <div className={DefaultLayoutStyles.navBar}>
        <div className={NavBarStyles.root}>
          <div className={NavBarStyles.toolSwitcher}>
            <ToolSwitcherItem title={text('title (prop)', 'Desk tool')} icon={ViewColumnIcon} />
          </div>
        </div>
      </div>
    )
  })
  .add('Not Found', () => {
    return <NotFound />
  })
  .add('Search', () => {
    return (
      <div className={DefaultLayoutStyles.navBar}>
        <div className={NavBarStyles.root}>
          <div className={NavBarStyles.search}>
            <Search
              inputValue={text('inputValue', '', 'props')}
              onInputChange={event => console.log('onInputChange', event)}
              isOpen={boolean('isOpen', false, 'props')}
              isSearching={boolean('isSearching', false, 'props')}
              renderItem={(i, index) => <div>Item</div>}
              hits={object('hits', [{index: 0, _id: 'id0', name: 'Test'}], undefined, 'props')}
            />
          </div>
        </div>
      </div>
    )
  })
  .add('Login Status', () => {
    return (
      <div className={DefaultLayoutStyles.navBar}>
        <div className={NavBarStyles.root}>
          <div className={NavBarStyles.loginStatus}>
            <LoginStatus
              user={{name: 'John Doe', profileImage: 'https://randomuser.me/api/portraits/men/12.jpg'}}
              onLogout={() => alert('logout')}
            />
          </div>
        </div>
      </div>
    )
  })
