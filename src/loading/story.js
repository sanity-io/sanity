import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'

import Spinner from 'part:@sanity/components/loading/spinner'
import AppLoadingScreen from './AppLoadingScreen'

storiesOf('Loading')
.addWithInfo(
  'Spinner',
  `
    Spinner block
  `,
  () => {
    return (
      <Spinner />
    )
  },
  {
    propTables: [Spinner],
    role: 'part:@sanity/components/loading/spinner'
  }
)
.addWithInfo(
  'Spinner inline',
  `
    Spinner
  `,
  () => {
    return (
      <div>
        This is an inline <Spinner inline /> spinner.
      </div>
    )
  },
  {
    propTables: [Spinner],
    role: 'part:@sanity/components/loading/spinner'
  }
)
.addWithInfo(
  'Spinner with message',
  `
    Spinner
  `,
  () => {
    return (
      <Spinner message="This is the message…" />
    )
  },
  {
    propTables: [Spinner],
    role: 'part:@sanity/components/loading/spinner'
  }
)
.addWithInfo(
  'Spinner inline with message',
  `
    Spinner
  `,
  () => {
    return (
      <Spinner inline message="Loading" />
    )
  },
  {
    propTables: [Spinner],
    role: 'part:@sanity/components/loading/spinner'
  }
)

.addWithInfo(
  'Spinner fullscreen',
  `
    Spinner
  `,
  () => {
    return (
      <Spinner fullscreen message="Loading" />
    )
  },
  {
    propTables: [Spinner],
    role: 'part:@sanity/components/loading/spinner'
  }
)

.addWithInfo(
  'App loading screen',
  `
    Used when app is loading. No use of CSSModules.
  `,
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
