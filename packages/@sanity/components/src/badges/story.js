/* eslint-disable max-nested-callbacks */
import React from 'react'

import Sanity from 'part:@sanity/storybook/addons/sanity'
import {storiesOf} from 'part:@sanity/storybook'
import DefaultBadge from 'part:@sanity/components/badges/default'

import {withKnobs, text, select, boolean, number} from 'part:@sanity/storybook/addons/knobs'

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: 0,
  left: 0
}

const colors = [undefined, 'success', 'danger', 'warning', 'info', 'neutral']

const selectColorKinds = () => select('color', colors, undefined, 'props')

storiesOf('Badges', module)
  .addDecorator(withKnobs)
  .add('Default', () => {
    return (
      <div style={{...centerStyle}}>
        <Sanity part="part:@sanity/components/badges/default" propTables={[DefaultBadge]}>
          <DefaultBadge
            color={selectColorKinds()}
            inverted={boolean('inverted', false, 'props')}
            faded={boolean('faded', false, 'props')}
            title={text('title', 'Hint hint hint!', 'props')}
          >
            {text('children', 'Cool', 'props')}
          </DefaultBadge>
        </Sanity>
      </div>
    )
  })
  .add('All versions', () => {
    return (
      <div
        style={{
          padding: '1rem',
          fontSize: `${number('font-size in px', 11, 'test')}px`
        }}
      >
        {colors.map(badgeColor => {
          return (
            <div key={badgeColor || 'none'} style={{padding: '1em'}}>
              {[false, true].map(inverted => {
                return [false, true].map(faded => {
                  return (
                    <DefaultBadge
                      color={badgeColor}
                      inverted={inverted}
                      faded={faded}
                      key={`badge_${badgeColor}_${inverted && 'inverted'}_${faded && 'faded'}`}
                    >
                      {badgeColor || 'No color'} {inverted && ' inverted'} {faded && 'faded'}
                    </DefaultBadge>
                  )
                })
              })}
            </div>
          )
        })}
      </div>
    )
  })

  .add('Example in text', () => {
    const color = selectColorKinds()
    return (
      <div style={{...centerStyle}}>
        <p>
          So Text. Much{' '}
          <DefaultBadge color={color} inverted={boolean('inverted', false, 'props')}>
            Badge
          </DefaultBadge>{' '}
          Baseline
          <DefaultBadge color={color} inverted={boolean('inverted', false, 'props')}>
            Wow
          </DefaultBadge>{' '}
          <DefaultBadge color={color} inverted={boolean('inverted', false, 'props')}>
            Such
          </DefaultBadge>{' '}
          <DefaultBadge color={color} inverted={boolean('inverted', false, 'props')}>
            Space
          </DefaultBadge>{' '}
          Test
        </p>
      </div>
    )
  })
