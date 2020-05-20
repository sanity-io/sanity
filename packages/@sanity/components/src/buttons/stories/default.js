import Button from 'part:@sanity/components/buttons/default'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select, boolean, button} from 'part:@sanity/storybook/addons/knobs'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

const actionsProps = {
  onBlur: action('onBlur'),
  onClick: action('onClick'),
  onFocus: action('onFocus')
}

export function DefaultStory() {
  let testElement = null

  function testFocus() {
    testElement.focus()
  }

  function setConfirmButton(element) {
    testElement = element
  }

  button('Test focus', () => testFocus(), 'test')

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/buttons/default" propTables={[Button]}>
        <Button
          {...actionsProps}
          kind={select('kind', ['default', 'simple', 'secondary'], 'default', 'props')}
          disabled={boolean('disabled', false, 'props')}
          inverted={boolean('inverted', false, 'props')}
          color={select(
            'color',
            [undefined, 'primary', 'success', 'warning', 'danger', 'white'],
            undefined,
            'props'
          )}
          loading={boolean('loading', false, 'props')}
          icon={boolean('icon', false, 'props') ? SanityLogoIcon : false}
          ref={setConfirmButton}
          bleed={boolean('bleed', false, 'props')}
        >
          {text('children', 'Touch Me!', 'props')}
        </Button>
      </Sanity>
    </CenteredContainer>
  )
}
