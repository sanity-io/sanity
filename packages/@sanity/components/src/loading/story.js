import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'

import Spinner from 'part:@sanity/components/loading/spinner'
import styles from 'part:@sanity/components/loading/spinner-style'
import AppLoadingScreen from 'part:@sanity/base/app-loading-screen'

import {withKnobs, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

import CompanyLogo from 'part:@sanity/base/company-logo?'
import SanityLogo from 'part:@sanity/base/sanity-logo'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'

function renderCustomChildren() {
  return (
    <div className={styles.message}>
      <SanityLogoIcon /> :wave:
    </div>
  )
}

storiesOf('Loading')
  .addDecorator(withKnobs)
  .add('Spinner', () => {
    return (
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
    )
  })

  .add(
    'App loading screen',
    //   Used when app is loading. No use of CSSModules.
    () => {
      const logo = CompanyLogo || SanityLogo
      return (
        <Sanity part="part:@sanity/base/app-loading-screen" propTables={[AppLoadingScreen]}>
          <AppLoadingScreen
            logo={boolean('logo', false, 'props') && logo}
            text={text('text', undefined, 'props')}
          />
        </Sanity>
      )
    }
  )
