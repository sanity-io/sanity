import React from 'react'

import {RouterProvider, route} from 'part:@sanity/base/router'
import Button from 'part:@sanity/components/buttons/default'
import AnchorButton from 'part:@sanity/components/buttons/anchor'
import IntentButton from 'part:@sanity/components/buttons/intent'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import InInputButton from 'part:@sanity/components/buttons/in-input'
import InInputStyles from 'part:@sanity/components/buttons/in-input-style'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs, text, select, boolean, object} from 'part:@sanity/storybook/addons/knobs'
import PlusIcon from 'part:@sanity/base/plus-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const handleNavigate = () => {
  /* intentional noop */
}
const router = route('/', [route('/bikes/:bikeId'), route.intents('/intents')])
const preventDefault = evt => evt.preventDefault()
const getButtonKinds = () => select('kind (prop)', ['default', 'simple', 'secondary'], 'default')
const getColorKinds = () =>
  select('color (prop)', [false, 'primary', 'success', 'danger', 'white'], false)

const items = [
  {index: '1', title: 'Test'},
  {index: '2', title: 'Test 2'},
  {index: '3', title: 'Test 3'},
  {index: '4', title: 'Test 4'},
  {index: '5', title: 'Test 5'},
  {index: '6', title: 'Test 6'},
  {index: '7', title: 'Test 7'}
]

storiesOf('Buttons', module)
  .addDecorator(withKnobs)
  .add('Default', () => {
    return (
      <Sanity part="part:@sanity/components/buttons/default" propTables={[Button]}>
        <Button
          kind={getButtonKinds()}
          onClick={action('clicked')}
          disabled={boolean('disabled (prop)', false)}
          inverted={boolean('inverted (prop)', false)}
          type={text('type (prop)', undefined)}
          color={getColorKinds()}
          loading={boolean('Loading (prop)', false)}
          icon={boolean('Show test icon', false) ? SanityLogoIcon : false}
        >
          {text('prop: children', 'Touch Me!')}
        </Button>
      </Sanity>
    )
  })
  .add('Anchor <a>', () => {
    return (
      <Sanity part="part:@sanity/components/buttons/anchor" propTables={[Button]}>
        <AnchorButton
          kind={getButtonKinds()}
          onClick={action('clicked')}
          disabled={boolean('prop: disabled', false)}
          inverted={boolean('prop: inverted', false)}
          color={getColorKinds()}
          loading={boolean('prop: loading', false)}
          icon={boolean('show test icon', false) ? SanityLogoIcon : false}
          href={text('prop: href', 'http://example.org')}
        >
          {text('prop: children', 'Touch Me!')}
        </AnchorButton>
      </Sanity>
    )
  })
  .add('Examples', () => {
    const disabled = boolean('Disabled', false)
    return (
      <RouterProvider
        router={router}
        onNavigate={handleNavigate}
        state={router.decode(location.pathname)}
      >
        <form style={{padding: '2rem'}}>
          <h2>Default</h2>
          <Button onClick={action('clicked')} icon={SanityLogoIcon} disabled={disabled}>
            Default
          </Button>
          <Button onClick={action('clicked')} icon={SanityLogoIcon} inverted disabled={disabled}>
            Inverted
          </Button>
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            kind="simple"
            disabled={disabled}
          >
            Simple
          </Button>

          <h2>Colors</h2>
          <Button onClick={action('clicked')} disabled={disabled}>
            Undefined
          </Button>
          <Button onClick={action('clicked')} color="primary" disabled={disabled}>
            Primary
          </Button>
          <Button onClick={action('clicked')} color="danger" disabled={disabled}>
            Danger
          </Button>
          <Button onClick={action('clicked')} color="success" disabled={disabled}>
            Success
          </Button>

          <h2>Colors (inverted)</h2>
          <Button onClick={action('clicked')} inverted disabled={disabled}>
            Undefined
          </Button>
          <Button onClick={action('clicked')} color="primary" inverted disabled={disabled}>
            Primary
          </Button>
          <Button onClick={action('clicked')} color="danger" inverted disabled={disabled}>
            Danger
          </Button>
          <Button onClick={action('clicked')} color="success" inverted disabled={disabled}>
            Success
          </Button>
          <DropDownButton items={items} onAction={action('Clicked item')} disabled={disabled}>
            Dropdown
          </DropDownButton>

          <h2>Colors (simple)</h2>
          <Button onClick={action('clicked')} kind="simple" disabled={disabled}>
            Undefined
          </Button>
          <Button onClick={action('clicked')} kind="simple" color="primary" disabled={disabled}>
            Primary
          </Button>
          <Button onClick={action('clicked')} kind="simple" color="danger" disabled={disabled}>
            Danger
          </Button>
          <Button onClick={action('clicked')} kind="simple" color="success" disabled={disabled}>
            Success
          </Button>

          <h2>With icons</h2>
          <Button onClick={action('clicked')} icon={SanityLogoIcon} disabled={disabled}>
            With icon
          </Button>
          <Button
            onClick={action('clicked')}
            color="danger"
            icon={SanityLogoIcon}
            disabled={disabled}
          >
            Colored with icon
          </Button>
          <Button
            onClick={action('clicked')}
            color="danger"
            icon={SanityLogoIcon}
            inverted
            disabled={disabled}
          >
            Danger, inverted & icon
          </Button>
          <DropDownButton
            icon={SanityLogoIcon}
            inverted
            color="danger"
            items={items}
            onAction={action('Clicked item')}
            disabled={disabled}
          >
            Dropdown
          </DropDownButton>

          <h2>Only icons</h2>
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            title="Default"
            disabled={disabled}
          />
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            color="danger"
            title="Danger"
            disabled={disabled}
          />
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            inverted
            title="Inverted"
            disabled={disabled}
          />
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            inverted
            color="danger"
            title="Inverted danger"
            disabled={disabled}
          />
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            kind="simple"
            title="Simple"
            disabled={disabled}
          />
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            kind="simple"
            color="danger"
            title="Simple danger"
            disabled={disabled}
          />
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            kind="simple"
            color="primary"
            title="Simple primary"
            disabled={disabled}
          />

          <h2>Intent buttons with only icons</h2>
          <IntentButton
            intent="create"
            params={{type: 'book'}}
            onClick={preventDefault}
            icon={PlusIcon}
            title="Default"
            disabled={disabled}
          />
          <IntentButton
            intent="create"
            params={{type: 'book'}}
            onClick={preventDefault}
            icon={PlusIcon}
            color="danger"
            title="Danger"
            disabled={disabled}
          />
          <IntentButton
            intent="create"
            params={{type: 'book'}}
            onClick={preventDefault}
            icon={PlusIcon}
            inverted
            title="Inverted"
            disabled={disabled}
          />
          <IntentButton
            intent="create"
            params={{type: 'book'}}
            onClick={preventDefault}
            icon={PlusIcon}
            inverted
            color="danger"
            title="Inverted danger"
            disabled={disabled}
          />
          <IntentButton
            intent="create"
            params={{type: 'book'}}
            onClick={preventDefault}
            icon={PlusIcon}
            kind="simple"
            title="Simple"
            disabled={disabled}
          />
          <IntentButton
            intent="create"
            params={{type: 'book'}}
            onClick={preventDefault}
            icon={PlusIcon}
            kind="simple"
            color="danger"
            title="Simple danger"
            disabled={disabled}
          />
          <IntentButton
            intent="create"
            params={{type: 'book'}}
            onClick={preventDefault}
            icon={PlusIcon}
            kind="simple"
            color="primary"
            title="Simple primary"
            disabled={disabled}
          />

          <h2>On color areas</h2>
          <div style={{backgroundColor: 'red', padding: '1rem'}}>
            <Button onClick={action('clicked')} color="white" disabled={disabled}>
              White
            </Button>
            <Button onClick={action('clicked')} kind="simple" color="white" disabled={disabled}>
              White simple
            </Button>
            <Button onClick={action('clicked')} inverted disabled={disabled}>
              Inverted
            </Button>
            <Button onClick={action('clicked')} inverted color="white" disabled={disabled}>
              White inverted
            </Button>
          </div>
        </form>
      </RouterProvider>
    )
  })
  .add('DropDownButton', () => {
    return (
      <Sanity part="part:@sanity/components/buttons/dropdown" propTables={[DropDownButton]}>
        <RouterProvider
          router={router}
          onNavigate={handleNavigate}
          state={router.decode(location.pathname)}
        >
          <div>
            <DropDownButton
              items={object('prop: items', items)}
              onAction={action('Clicked item')}
              color={getColorKinds()}
              kind={getButtonKinds()}
            >
              {text('prop: children', 'This is a dropdown')}
            </DropDownButton>
            <div>This text should be under the menu</div>
          </div>
        </RouterProvider>
      </Sanity>
    )
  })
  .add('InInput', () => {
    return (
      <Sanity part="part:@sanity/components/buttons/in-input" propTables={[InInputButton]}>
        <DefaultFormField label="Default">
          <div className={InInputStyles.wrapper}>
            <DefaultTextInput />
            <div className={InInputStyles.container}>
              <InInputButton
                onAction={action('Clicked item')}
                color={getColorKinds()}
                kind={getButtonKinds()}
              >
                browse
              </InInputButton>
            </div>
          </div>
        </DefaultFormField>
      </Sanity>
    )
  })
