import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'

import Spinner from 'part:@sanity/components/loading/spinner'
import AppLoadingScreen from './AppLoadingScreen'

import {withKnobs, boolean, text} from 'part:@sanity/storybook/addons/knobs'

storiesOf('Loading')
.addDecorator(withKnobs)
.add(
  'Spinner',
  () => {
    return (
      <Spinner
        inline={boolean('inline', false)}
        message={text('Message', 'This is the message')}
        fullscreen={boolean('fullscreen', false)}
      />
    )
  },
  {
    propTables: [Spinner],
    role: 'part:@sanity/components/loading/spinner'
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
  },
  {
    propTables: [AppLoadingScreen],
    role: 'part:@sanity/components/loading/app-loading-screen'
  }
)
