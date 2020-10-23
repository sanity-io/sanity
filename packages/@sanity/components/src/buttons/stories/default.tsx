import Button from 'part:@sanity/components/buttons/default'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, select, boolean, button} from 'part:@sanity/storybook/addons/knobs'
import UsersIcon from 'part:@sanity/base/users-icon'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

const actionsProps = {
  onBlur: action('onBlur'),
  onClick: action('onClick'),
  onFocus: action('onFocus'),
}

let buttonElement: HTMLButtonElement | null = null

function testFocus() {
  if (buttonElement) buttonElement.focus()
}

function setButtonElement(element: HTMLButtonElement | null) {
  buttonElement = element
}

export function DefaultStory() {
  button('Test focus', testFocus, 'test')

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
    icon: boolean('Icon', undefined, 'props') ? UsersIcon : undefined,
    iconStatus: select(
      'Icon status',
      [undefined, 'primary', 'success', 'warning', 'danger'],
      undefined,
      'props'
    ),
    padding: select('Padding', ['small', 'medium', 'large', 'none'], 'medium', 'props'),
    bleed: boolean('Bleed', false, 'props'),
    selected: boolean('Selected', false, 'props'),
    size:
      select('Size', ['', 'extra-small', 'small', 'medium', 'large', 'extra-large'], '', 'props') ||
      undefined,
    tone: select('Tone', {'': '(none)', navbar: 'Navbar'}, '', 'Props') || undefined,
  }

  const children = text('Text', 'Label', 'props')

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/buttons/default" propTables={[Button]}>
        <div style={{width: '100%', maxWidth: 300}}>
          <div>
            <h2>kind="default"</h2>
            <Button {...buttonProps} ref={setButtonElement as any}>
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
