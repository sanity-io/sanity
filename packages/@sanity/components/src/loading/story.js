import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'

import Spinner from 'part:@sanity/components/loading/spinner'
import AppLoadingScreen from './AppLoadingScreen'

import {withKnobs, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

storiesOf('Loading')
.addDecorator(withKnobs)
.add(
  'Spinner',
  () => {
    return (
      <Sanity part="part:@sanity/components/loading/spinner" propTables={[Spinner]}>
        <Spinner
          inline={boolean('inline', false)}
          message={text('Message', 'This is the message')}
          fullscreen={boolean('fullscreen', false)}
        />
      </Sanity>
    )
  }
)

.add(
  'App loading screen',
  // `
  //   Used when app is loading. No use of CSSModules.
  // `,
  () => {
    return (
      <AppLoadingScreen />
    )
  }
)
