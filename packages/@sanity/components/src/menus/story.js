import React from 'react'
import Menu from 'part:@sanity/components/menus/default'
//import StateMenu from 'part:@sanity/components/menus/state'
import {storiesOf, action} from 'part:@sanity/storybook'
import SanityIcon from 'part:@sanity/base/sanity-logo-icon'
import {withKnobs, boolean, number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {range} from 'lodash'
import Chance from 'chance'
const chance = new Chance()

storiesOf('Menus')
.addDecorator(withKnobs)
.add(
  'Default',
  () => {

    const icon = boolean('icons', false) ? SanityIcon : false
    const top = number('top', 40)
    const left = number('left', 40)
    const items = range(number('#items', 30)).map((item, i) => {
      return {
        title: chance.name(),
        icon: icon,
        key: i
      }
    })

    return (
      <Sanity part="part:@sanity/components/menus/default" propTables={[Menu]}>
        <div
          style={{
            width: '300px',
            position: 'relative'
          }}
        >
          <div style={{position: 'absolute', top: `${top}px`, left: `${left}px`}}>
            <Menu
              onAction={action('onAction')}
              onClose={action('onClose')}
              onClickOutside={action('Clicked outside')}
              items={items}
              opened={boolean('opened', true)}
            />
          </div>
        </div>
      </Sanity>
    )
  }
)
