import React from 'react'

import Button from 'part:@sanity/components/buttons/default'
import AnchorButton from 'part:@sanity/components/buttons/anchor'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import InInputButton from 'part:@sanity/components/buttons/in-input'
import InInputStyles from 'part:@sanity/components/buttons/in-input-style'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs, text, select, boolean, object} from 'part:@sanity/storybook/addons/knobs'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const getButtonKinds = () => select('Kind', ['default', 'simple', 'secondary'], 'default')
const getColorKinds = () => select('Color', [false, 'primary', 'success', 'danger', 'white'], false)

storiesOf('Buttons', module)
  .addDecorator(withKnobs)
  .add(
    'Default',
    () => {
      return (
        <Sanity part="part:@sanity/components/buttons/default" propTables={[Button]}>
          <Button
            kind={getButtonKinds()}
            onClick={action('clicked')}
            disabled={boolean('Disabled', false)}
            inverted={boolean('Inverted', false)}
            color={getColorKinds()}
            loading={boolean('Loading', false)}
            icon={boolean('icon', false) ? SanityLogoIcon : false}
          >
            {text('Text', 'Touch Me!')}
          </Button>
        </Sanity>
      )
    }
  )
  .add(
    'Anchor <a>',
    () => {
      return (
        <Sanity part="part:@sanity/components/buttons/anchor" propTables={[Button]}>
          <AnchorButton
            kind={getButtonKinds()}
            onClick={action('clicked')}
            disabled={boolean('Disabled', false)}
            inverted={boolean('Inverted', false)}
            color={getColorKinds()}
            loading={boolean('Loading', false)}
            icon={boolean('icon', false) ? SanityLogoIcon : false}
            href={text('href', 'http://example.org')}
          >
            {text('Text', 'Touch Me!')}
          </AnchorButton>
        </Sanity>
      )
    }
  )
.add(
  'Examples',
  () => (
    <form>
      <h2>Default</h2>
      <Button onClick={action('clicked')} icon={SanityLogoIcon}>
        Default
      </Button>
      <Button onClick={action('clicked')} icon={SanityLogoIcon} inverted>
        Inverted
      </Button>
      <Button onClick={action('clicked')} icon={SanityLogoIcon} kind="simple">
        Simple
      </Button>

      <Button onClick={action('clicked')} kind="secondary" icon={SanityLogoIcon}>
        Secondary
      </Button>


      <h2>Colors</h2>
      <Button onClick={action('clicked')}>
        Undefined
      </Button>
      <Button onClick={action('clicked')} color="primary">
        Primary
      </Button>
      <Button onClick={action('clicked')} color="danger">
        Danger
      </Button>
      <Button onClick={action('clicked')} color="success">
        Success
      </Button>

      <h2>Colors (secondary)</h2>
      <Button onClick={action('clicked')} kind="simple">
        Undefined
      </Button>
      <Button onClick={action('clicked')} kind="secondary" color="primary">
        Primary
      </Button>
      <Button onClick={action('clicked')} kind="secondary" color="danger">
        Danger
      </Button>
      <Button onClick={action('clicked')} kind="secondary" color="success">
        Success
      </Button>


      <h2>Colors (inverted)</h2>
      <Button onClick={action('clicked')} inverted>
        Undefined
      </Button>
      <Button onClick={action('clicked')} color="primary" inverted>
        Primary
      </Button>
      <Button onClick={action('clicked')} color="danger" inverted>
        Danger
      </Button>
      <Button onClick={action('clicked')} color="success" inverted>
        Success
      </Button>

      <h2>Colors (simple)</h2>
      <Button onClick={action('clicked')} kind="simple">
        Undefined
      </Button>
      <Button onClick={action('clicked')} kind="simple" color="primary">
        Primary
      </Button>
      <Button onClick={action('clicked')} kind="simple" color="danger">
        Danger
      </Button>
      <Button onClick={action('clicked')} kind="simple" color="success">
        Success
      </Button>

      <h2>Secondary</h2>
      <Button onClick={action('clicked')} inverted>
        Inverted
      </Button>
      <Button onClick={action('clicked')} color="danger" inverted>
        Inverted color:danger
      </Button>

      <Button onClick={action('clicked')} color="danger">
        Color:danger
      </Button>

      <h2>With icons</h2>
      <Button onClick={action('clicked')} icon={SanityLogoIcon}>
        With icon
      </Button>
      <Button onClick={action('clicked')} color="danger" icon={SanityLogoIcon}>
        Colored with icon
      </Button>
      <Button onClick={action('clicked')} color="danger" icon={SanityLogoIcon} inverted>
        Danger, inverted & icon
      </Button>

      <h2>Only icons</h2>
      <Button onClick={action('clicked')} icon={SanityLogoIcon} title="Default" />
      <Button onClick={action('clicked')} icon={SanityLogoIcon} color="danger" title="Danger" />
      <Button onClick={action('clicked')} icon={SanityLogoIcon} inverted title="Inverted" />
      <Button onClick={action('clicked')} icon={SanityLogoIcon} inverted color="danger" title="Inverted danger" />
      <Button onClick={action('clicked')} icon={SanityLogoIcon} kind="simple" title="Simple" />
      <Button onClick={action('clicked')} icon={SanityLogoIcon} kind="simple" color="danger" title="Simple danger" />

      <h2>On color areas</h2>
      <div style={{backgroundColor: 'red', padding: '1rem'}}>
        <Button onClick={action('clicked')} color="white">
          White
        </Button>
        <Button onClick={action('clicked')} inverted>
          Inverted
        </Button>
        <Button onClick={action('clicked')} inverted color="white">
          White inverted
        </Button>
      </div>
    </form>
  )
)
.add(
    'DropDownButton',
    () => {
      const items = [
        {index: '1', title: 'Test'},
        {index: '2', title: 'Test 2'},
        {index: '3', title: 'Test 3'},
        {index: '4', title: 'Test 4'},
        {index: '5', title: 'Test 5'},
        {index: '6', title: 'Test 6'},
        {index: '7', title: 'Test 7'},
      ]
      return (
        <Sanity part="part:@sanity/components/buttons/dropdown" propTables={[DropDownButton]}>
          <div>
            <DropDownButton
              items={object('items', items)}
              onAction={action('Clicked item')}
              color={getColorKinds()}
              kind={getButtonKinds()}
            >
              {text('content', 'This is a dropdown')}
            </DropDownButton>
            <div>
              This text should be under the menu
            </div>
          </div>
        </Sanity>
      )
    }
  )
  .add(
    'InInput',
    () => {
      return (
        <Sanity part="part:@sanity/components/buttons/in-input" propTables={[InInputButton]}>
          <DefaultFormField label="Default">
            <div className={InInputStyles.wrapper}>
              <DefaultTextInput />
              <div className={InInputStyles.container}>
                <InInputButton onAction={action('Clicked item')} color={getColorKinds()} kind={getButtonKinds()}>browse</InInputButton>
              </div>
            </div>
          </DefaultFormField>
        </Sanity>
      )
    }
  )
