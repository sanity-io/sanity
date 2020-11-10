import {ClickOutside} from 'part:@sanity/components/click-outside'
import {action} from 'part:@sanity/storybook/addons/actions'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

export function DefaultStory() {
  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/buttons/default" propTables={[ClickOutside]}>
        <ClickOutside onClickOutside={action('click outside')}>
          {(ref) => (
            <div
              onClick={action('click inside')}
              ref={ref}
              style={{background: '#fff', border: '1px solid #999', padding: '2em'}}
            >
              click inside/outside
            </div>
          )}
        </ClickOutside>
      </Sanity>
    </CenteredContainer>
  )
}
