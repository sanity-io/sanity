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
  let buttonElement = null

  function testFocus() {
    if (buttonElement) buttonElement.focus()
  }

  function setButtonElement(element) {
    buttonElement = element
  }

  button('Test focus', () => testFocus(), 'test')

  const buttonProps = {
    ...actionsProps,
    disabled: boolean('Disabled', false, 'props'),
    inverted: boolean('Inverted', false, 'props'),
    color: select(
      'Color',
      [undefined, 'primary', 'success', 'warning', 'danger', 'white'],
      undefined,
      'props'
    ),
    loading: boolean('Loading', false, 'props'),
    icon: boolean('Icon', undefined, 'props') ? TrashIcon : undefined,
    padding: select('Padding', ['large', 'default', 'small', 'none'], 'default', 'props'),
    bleed: boolean('Bleed', false, 'props'),
    selected: boolean('Selected', false, 'props'),
    size: select(
      'Size',
      [undefined, 'extra-small', 'small', 'medium', 'large', 'extra-large'],
      undefined,
      'props'
    )
  }

  const children = text('Text', 'Touch Me!', 'props')

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/buttons/default" propTables={[Button]}>
        <div>
          <div>
            <h2>kind="default"</h2>
            <Button {...buttonProps} ref={setButtonElement}>
              {children}
            </Button>
          </div>

          <div>
            <h2>kind="simple"</h2>
            <Button {...buttonProps} kind="simple">
              {children}
            </Button>
          </div>
        </div>
      </Sanity>
    </CenteredContainer>
  )
}
