import React from 'react'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import Spinner from 'part:@sanity/components/loading/spinner'
import styles from 'part:@sanity/components/loading/spinner-style'
import {boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'

function renderCustomChildren() {
  return (
    <div className={styles.message}>
      <SanityLogoIcon /> :wave:
    </div>
  )
}

export function SpinnerStory() {
  return (
    <CenteredContainer style={{background: 'none'}}>
      <div
        style={{
          width: '100%',
          minWidth: 300,
          maxWidth: 500,
          background: '#fff',
          lineHeight: 0,
        }}
      >
        <Sanity part="part:@sanity/components/loading/spinner" propTables={[Spinner]}>
          <Spinner
            inline={boolean('inline', false, 'props')}
            message={text('Message', 'This is the message', 'props')}
            fullscreen={boolean('fullscreen', false, 'props')}
            center={boolean('center', false, 'props')}
          >
            {boolean('Custom children', false) && renderCustomChildren()}
          </Spinner>
        </Sanity>
      </div>
    </CenteredContainer>
  )
}
