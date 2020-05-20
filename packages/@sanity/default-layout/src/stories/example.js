import React from 'react'
import {Tooltip} from 'react-tippy'
import {action} from 'part:@sanity/storybook/addons/actions'
import {boolean, number, select} from 'part:@sanity/storybook/addons/knobs'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import PlusIcon from 'part:@sanity/base/plus-icon'
import PluginIcon from 'part:@sanity/base/plugin-icon'
import ViewColumnIcon from 'part:@sanity/base/view-column-icon'
import Branding from '../navbar/branding/Branding'
import ToolSwitcherWidget from '../navbar/toolMenu/ToolSwitcherWidget'
import LoginStatus from '../navbar/loginStatus/LoginStatus'
import SanityStatus from '../navbar/studioStatus/SanityStatus'
import SearchField from '../navbar/search/SearchField'
import SearchResults from '../navbar/search/SearchResults'
import ToolSwitcherItem from '../navbar/toolMenu/ToolSwitcherItem'

import NavBarStyles from '../navbar/NavBar.css'
import DefaultLayoutStyles from '../DefaultLayout.css'

const noop = () => undefined

function SearchResultItem(key) {
  return (
    <div key={key} style={{padding: '0.5em 0.75em'}}>
      {key}
    </div>
  )
}

function CustomToolSwitcherItem(tool) {
  return <ToolSwitcherItem title={tool.name} icon={tool.icon} />
}

export function ExampleStory() {
  const menuIsOpen = boolean('menuIsOpen', false, 'props')
  const searchIsOpen = boolean('searchIsOpen', false, 'props')
  const sanityStatusIsUpToDate = boolean('sanityStatusIsUpToDate', true, 'props')
  const sanityStatusLevel = select(
    'sanityStatusLevel',
    ['notice', 'low', 'medium', 'high'],
    'notice',
    'props'
  )
  const sanityStatusNumberOfUpdates = number('sanityStatusNumberOfUpdates', 0, 'props')
  const sanityStatusVersions = {}
  const sanityStatusOutdated = Array.from(new Array(sanityStatusNumberOfUpdates)).map(() => ({}))
  const isOverlayVisible = menuIsOpen || searchIsOpen
  let className = DefaultLayoutStyles.root
  if (isOverlayVisible) className += ` ${DefaultLayoutStyles.isOverlayVisible}`

  return (
    <div className={className}>
      <div className={DefaultLayoutStyles.navBar}>
        <div className={`${NavBarStyles.root} ${NavBarStyles.withToolSwitcher}`}>
          <div className={NavBarStyles.hamburger}>
            <button
              className={NavBarStyles.hamburgerButton}
              type="button"
              title="Menu"
              onClick={action('onClick')}
            >
              <HamburgerIcon />
            </button>
          </div>
          <a className={NavBarStyles.branding} href="#" onClick={evt => evt.preventDefault()}>
            <Branding />
          </a>
          <button className={NavBarStyles.createButton} onClick={noop} type="button">
            <Tooltip
              disabled={'ontouchstart' in document.documentElement}
              title="Create new document"
              arrow
              inertia
              theme="dark"
              distance="7"
              sticky
              size="small"
            >
              <div className={NavBarStyles.createButtonInner} tabIndex={-1}>
                <div className={NavBarStyles.createButtonIcon}>
                  <PlusIcon />
                </div>
                <span className={NavBarStyles.createButtonText}>New</span>
              </div>
            </Tooltip>
          </button>
          <div className={NavBarStyles.search}>
            <SearchField
              hotkeys={['F']}
              isFocused={boolean('searchIsFocused', false, 'props')}
              isOpen={searchIsOpen}
              results={
                <SearchResults
                  activeIndex={number('searchActiveIndex', -1, 'props')}
                  isLoading={boolean('searchIsLoading', false, 'props')}
                  items={[]}
                  query={''}
                  renderItem={SearchResultItem}
                />
              }
              value={''}
              onChange={action('onChange')}
            />
          </div>
          {/* spaceSwitcher */}
          <div className={NavBarStyles.toolSwitcher}>
            <ToolSwitcherWidget
              onSwitchTool={action('onSwitchTool')}
              tools={[
                {
                  name: 'Desk tool',
                  icon: ViewColumnIcon
                },
                {
                  name: 'Plugin 1',
                  icon: PluginIcon
                },
                {
                  name: 'Plugin 2',
                  icon: PluginIcon
                }
              ]}
              renderItem={CustomToolSwitcherItem}
            />
          </div>
          <div className={NavBarStyles.sanityStatus}>
            <SanityStatus
              isSupported
              isUpToDate={sanityStatusIsUpToDate}
              level={sanityStatusLevel}
              onHideDialog={noop}
              onShowDialog={noop}
              outdated={sanityStatusOutdated}
              versions={sanityStatusVersions}
            />
          </div>
          <div className={NavBarStyles.loginStatus}>
            <LoginStatus
              user={{
                name: 'John Doe',
                profileImage: 'https://randomuser.me/api/portraits/men/12.jpg'
              }}
              onLogout={action('onLogout')}
            />
          </div>
          {/* searchButton */}
        </div>
      </div>
    </div>
  )
}
