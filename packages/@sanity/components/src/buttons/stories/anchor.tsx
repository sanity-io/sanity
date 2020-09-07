import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import AnchorButton from 'part:@sanity/components/buttons/anchor'
import Button from 'part:@sanity/components/buttons/default'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select, boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

const actionsProps = {
  onBlur: action('onBlur'),
  onClick: action('onClick'),
  onFocus: action('onFocus')
}

export function AnchorStory() {
  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/buttons/anchor" propTables={[Button]}>
        <AnchorButton
          {...actionsProps}
          kind={select('kind', ['default', 'simple', 'secondary'], 'default', 'props')}
          disabled={boolean('disabled', false, 'props')}
          inverted={boolean('inverted', false, 'props')}
          color={select(
            'color',
            [undefined, 'primary', 'success', 'danger', 'white'],
            undefined,
            'props'
          )}
          loading={boolean('loading', false, 'props')}
          icon={boolean('icon', false, 'props') ? SanityLogoIcon : undefined}
          href={text('href', 'http://example.org', 'props')}
        >
          {text('children', 'Touch Me!', 'props')}
        </AnchorButton>
      </Sanity>
    </CenteredContainer>
  )
}
