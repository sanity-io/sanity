import Button from 'part:@sanity/components/buttons/default'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select, boolean, button} from 'part:@sanity/storybook/addons/knobs'
import TrashIcon from 'part:@sanity/base/trash-icon'
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
          kind={select('Kind', ['default', 'simple', 'secondary'], 'default', 'props')}
          disabled={boolean('Disabled', false, 'props')}
          inverted={boolean('Inverted', false, 'props')}
          color={select(
            'Color',
            [undefined, 'primary', 'success', 'warning', 'danger', 'white'],
            undefined,
            'props'
          )}
          loading={boolean('Loading', false, 'props')}
          icon={boolean('Icon', false, 'props') ? TrashIcon : false}
          padding={select('Padding', ['large', 'default', 'small', 'none'], 'default', 'props')}
          ref={setConfirmButton}
          bleed={boolean('Bleed', false, 'props')}
        >
          {text('Text', 'Touch Me!', 'props')}
        </Button>
      </Sanity>
    </CenteredContainer>
  )
}
