import React from 'react'
import Menu from 'part:@sanity/components/menus/default'
//import StateMenu from 'part:@sanity/components/menus/state'
import {storiesOf, action} from 'part:@sanity/storybook'
import SanityIcon from 'part:@sanity/base/sanity-logo-icon'
import {withKnobs, number, boolean, select} from 'part:@sanity/storybook/addons/knobs'
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

    const origins = {
      'top-left': 'Top Left',
      'top-right': 'Top Right',
      'bottom-right': 'Bottom Right',
      'bottom-left': 'Bottom left',
    }

    return (
      <Sanity part="part:@sanity/components/menus/default" propTables={[Menu]}>
        <div
          style={{
            width: '70vw',
            height: '70vh',
            border: '1px dotted #ccc',
            position: 'relative',
            overflow: 'scroll'
          }}
        >
          <div style={{position: 'absolute', top: `${top}px`, left: `${left}px`}}>
            <Menu
              onAction={action('prop:onAction')}
              onClose={action('prop:onClose')}
              onClickOutside={action('prop:onClickOutside')}
              items={items}
              origin={select('prop:origin', origins)}
              isOpen={boolean('prop: isOpen', true)}
            />
          </div>
        </div>
      </Sanity>
    )
  }
)
