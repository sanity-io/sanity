import React from 'react'
import {Tooltip} from 'part:@sanity/components/tooltip'
import {action} from 'part:@sanity/storybook/addons/actions'
import {boolean, number, select} from 'part:@sanity/storybook/addons/knobs'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import ComposeIcon from 'part:@sanity/base/compose-icon'
import PluginIcon from 'part:@sanity/base/plugin-icon'
import ViewColumnIcon from 'part:@sanity/base/view-column-icon'
import Branding from '../navbar/branding/Branding'
import ToolSwitcherWidget from '../navbar/toolMenu/ToolSwitcherWidget'
import LoginStatus from '../navbar/loginStatus/LoginStatus'
import SanityStatus from '../navbar/studioStatus/SanityStatus'
import SearchField from '../navbar/search/SearchField'
import SearchResults from '../navbar/search/SearchResults'
import ToolSwitcherItem from '../navbar/toolMenu/ToolSwitcherItem'

import NavbarStyles from '../navbar/Navbar.css'
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
        <div className={`${NavbarStyles.root} ${NavbarStyles.withToolSwitcher}`}>
          <div className={NavbarStyles.hamburger}>
            <button
              className={NavbarStyles.hamburgerButton}
              type="button"
              title="Menu"
              onClick={action('onClick')}
            >
              <HamburgerIcon />
            </button>
          </div>
          <a className={NavbarStyles.branding} href="#" onClick={evt => evt.preventDefault()}>
            <Branding />
          </a>
          <button className={NavbarStyles.createButton} onClick={noop} type="button">
            <Tooltip
              content={<>Create new document</>}
              disabled={'ontouchstart' in document.documentElement}
            >
              <div className={NavbarStyles.createButtonInner} tabIndex={-1}>
                <div className={NavbarStyles.createButtonIcon}>
                  <ComposeIcon />
                </div>
                <span className={NavbarStyles.createButtonText}>New</span>
              </div>
            </Tooltip>
          </button>
          <div className={NavbarStyles.search}>
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
          <div className={NavbarStyles.toolSwitcher}>
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
          <div className={NavbarStyles.sanityStatus}>
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
          <div className={NavbarStyles.loginStatus}>
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
