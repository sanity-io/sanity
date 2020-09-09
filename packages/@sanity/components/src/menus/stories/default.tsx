import React from 'react'
import DefaultMenu, {MenuItemType} from 'part:@sanity/components/menus/default'
import {action} from 'part:@sanity/storybook'
import SanityIcon from 'part:@sanity/base/sanity-logo-icon'
import {number, boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {DebugRouterProvider} from 'part:@sanity/storybook/components'
import {range} from 'lodash'
import Chance from 'chance'

const chance = new Chance()

export function DefaultStory() {
  const icon = boolean('icons', false) ? SanityIcon : false
  const items: MenuItemType[] = range(number('#items', 30)).map((item, i) => {
    return {
      title: chance.name(),
      icon: icon,
      key: String(i)
    }
  })

  const scrollStyle: React.CSSProperties = {
    width: '70vw',
    height: '70vh',
    border: '1px dotted #ccc',
    position: 'relative',
    overflow: 'scroll'
  }

  return (
    <DebugRouterProvider>
      <Sanity part="part:@sanity/components/menus/default" propTables={[DefaultMenu]}>
        <div style={boolean('is inside scroll', false) ? scrollStyle : {}}>
          <div>
            <DefaultMenu
              onAction={action('onAction')}
              onClose={action('onClose')}
              // onClickOutside={action('prop:onClickOutside')}
              items={items}
            />
          </div>
        </div>
      </Sanity>
    </DebugRouterProvider>
  )
}
