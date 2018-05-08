import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs, color, number} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

// All Sanity icons
import * as icons from 'part:@sanity/base/icons'

// Logos
import SanityLogo from 'part:@sanity/base/sanity-logo'
import SanityLogoAlpha from 'part:@sanity/base/sanity-logo-alpha'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'
import BrandLogo from 'part:@sanity/base/brand-logo?'
import styles from './styles/iconStory.css'

storiesOf('Icons')
  .addDecorator(withKnobs)
  .add(
    'Icons',
    () => {
      const options = {range: true, min: 0.02, max: 4, step: 0.02}
      return (
        <div>
          <pre className={styles.recipe}>
            <code>{`import {IconName} from 'part:@sanity/base/icons`}</code>
          </pre>
          <ul
            className={styles.sanityIcons}
            style={{
              color: color('color', '#333'),
              backgroundColor: color('background', '#fff'),
              fontSize: `${number('Size', 1, options)}rem`
            }}
          >
            {Object.keys(icons).map(key => {
              const Icon = icons[key]
              return (
                <li key={key} className={styles.item}>
                  <div className={styles.icon}>
                    <Icon />
                  </div>
                  <div className={styles.iconName}>{key}</div>
                </li>
              )
            })}
          </ul>
        </div>
      )
    },
    {inline: false}
  )

storiesOf('Logos')
  .addDecorator(withKnobs)
  .add('Sanity', () => {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          color: color('color', '#fff'),
          backgroundColor: color('background', '#f43')
        }}
      >
        <div
          style={{
            position: 'absolute',
            height: '50vh',
            width: '50vw',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Sanity part="part:@sanity/base/sanity-logo" propTables={[SanityLogo]}>
            <SanityLogo />
          </Sanity>
        </div>
      </div>
    )
  })
  .add('Sanity Icon', () => {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          color: color('color', '#fff'),
          backgroundColor: color('background', '#f43')
        }}
      >
        <div
          style={{
            position: 'absolute',
            height: '50vh',
            width: '50vw',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Sanity part="part:@sanity/base/sanity-logo-icon" propTables={[SanityLogoIcon]}>
            <SanityLogoIcon />
          </Sanity>
        </div>
      </div>
    )
  })
  .add('Sanity Alpha', () => {
    return (
      <Sanity part="part:@sanity/base/sanity-logo-alpha" propTables={[SanityLogoAlpha]}>
        <div
          style={{
            height: '100vh',
            display: 'flex',
            color: color('color', '#fff'),
            backgroundColor: color('background', '#f43')
          }}
        >
          <div
            style={{
              position: 'absolute',
              height: '50vh',
              width: '50vw',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <SanityLogoAlpha />
          </div>
        </div>
      </Sanity>
    )
  })

  .add('Brand', () => {
    if (!BrandLogo) {
      return (
        <div>
          No brand logo. Implement <code>part:@sanity/base/brand-logo</code>
        </div>
      )
    }
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          color: color('color', '#fff'),
          backgroundColor: color('background', '#f43')
        }}
      >
        <div
          style={{
            position: 'absolute',
            height: '50vh',
            width: '50vw',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Sanity part="part:@sanity/base/brand-logo" propTables={[BrandLogo]}>
            <BrandLogo />
          </Sanity>
        </div>
      </div>
    )
  })
  .add('Sanity Studio', () => {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          color: color('color', '#fff'),
          backgroundColor: color('background', '#f43')
        }}
      >
        <div
          style={{
            position: 'absolute',
            height: '50vh',
            width: '50vw',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Sanity part="part:@sanity/base/sanity-studio-logo" propTables={[SanityStudioLogo]}>
            <SanityStudioLogo />
          </Sanity>
        </div>
      </div>
    )
  })
