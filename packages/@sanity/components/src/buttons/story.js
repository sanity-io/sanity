import React from 'react'

import Button from 'part:@sanity/components/buttons/default'
import Fab from 'part:@sanity/components/buttons/fab'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import InInputButton from 'part:@sanity/components/buttons/in-input'
import InInputStyles from 'part:@sanity/components/buttons/in-input-style'
import {storiesOf, action} from 'part:@sanity/storybook'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {withKnobs, text, select} from 'part:@sanity/storybook/addons/knobs'

const getButtonKinds = () => select('Kind', ['default', 'simple', 'secondary'], 'default')

storiesOf('Buttons', module)
  .addDecorator(withKnobs)
  .addWithInfo(
    'Default Button',
    'Standard button Role: part:@sanity/components/buttons/default',
    () => (
      <Button kind={getButtonKinds()} onClick={action('clicked')}>{text('Text', 'Touch Me!')}</Button>
    ),
    {propTables: [Button], role: 'part:@sanity/components/buttons/default'}
  )
  .addWithInfo(
    'Default Button (disabled)',
    'Standard button Role: part:@sanity/components/buttons/default',
    () => (
      <Button onClick={action('clicked')} disabled>I&apos;m disabled!</Button>
    ),
    {propTables: [Button], role: 'part:@sanity/components/buttons/default'}
  )
  .addWithInfo(
  'Variations',
  '',
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
  ),
  {propTables: [Button], role: 'part:@sanity/components/buttons/default'}
  )

  .addWithInfo(
    'Fab (Floating Action Button)',
    'Borrowed from Googles material design. Used to create new stuff. Is by default fixed to bottom right.',
    () => {
      return (
        <div>
          <Fab onClick={action('onClick')} fixed={false} colored />
        </div>
      )
    },
    {propTables: [Fab], role: 'part:@sanity/components/buttons/fab'}
  )

  .addWithInfo(
    'DropDownButton',
    'Buttons that opens a menu.',
    () => {
      const items = [
        {index: '1', title: 'Test'},
        {index: '2', title: 'Test 2'},
        {index: '3', title: 'Test 3'}
      ]
      return (
        <div>
          <DropDownButton items={items} onAction={action('Clicked item')}>
            This is a dropdown
          </DropDownButton>
          <DropDownButton color="danger" items={items} onAction={action('Clicked item')}>
            This is a dangerrous dropdown
          </DropDownButton>
          <div>
            This text should be under the menu
          </div>
        </div>
      )
    },
    {propTables: [DropDownButton], role: 'part:@sanity/components/buttons/dropdown'}
  )

  .addWithInfo(
    'DropDownButton (wider menu)',
    'Buttons that opens a menu.',
    () => {
      const items = [
        {index: '1', title: 'Test asdfasdfsafdsadf'},
        {index: '2', title: 'Test 2 asfsa s sad sadf saf sa'},
        {index: '3', title: 'Test 3 asdfas fas fasdf asf asdf asdf sad'}
      ]
      return (
        <div>
          <DropDownButton items={items} onAction={action('Clicked item')} kind="simple">
            This is a dropdown
          </DropDownButton>
          <div>
            This text should be under the menu
          </div>
        </div>
      )
    },
    {propTables: [DropDownButton], role: 'part:@sanity/components/buttons/dropdown'}
  )

  .addWithInfo(
    'DropDownButton (simple)',
    'Buttons that opens a menu.',
    () => {
      const items = [
        {index: '1', title: 'Test'},
        {index: '2', title: 'Test 2'},
        {index: '3', title: 'Test 3'}
      ]
      return (
        <div>
          <DropDownButton items={items} onAction={action('Clicked item')} kind="simple">
            This is a dropdown
          </DropDownButton>
          <div>
            This text should be under the menu
          </div>
        </div>
      )
    },
    {propTables: [DropDownButton], role: 'part:@sanity/components/buttons/dropdown'}
  )
  .addWithInfo(
    'InInput',
    'Buttons that are inside an input field',
    () => {
      return (
        <div>
          <DefaultFormField label="Default">
            <div className={InInputStyles.wrapper}>
              <DefaultTextInput />
              <div className={InInputStyles.container}>
                <InInputButton onAction={action('Clicked item')}>browse</InInputButton>
              </div>
            </div>
          </DefaultFormField>
          <DefaultFormField label="This is the with danger button">
            <div className={InInputStyles.wrapper}>
              <DefaultTextInput />
              <div className={InInputStyles.container}>
                <InInputButton onAction={action('Clicked item')} kind="danger">delete</InInputButton>
              </div>
            </div>
          </DefaultFormField>
          <DefaultFormField label="More buttons">
            <div className={InInputStyles.wrapper}>
              <DefaultTextInput />
              <div className={InInputStyles.container}>
                <InInputButton onAction={action('Clicked item')} kind="danger">Delete</InInputButton>
                <InInputButton onAction={action('Clicked item')}>Change</InInputButton>
              </div>
            </div>
          </DefaultFormField>
        </div>

      )
    },
    {propTables: [InInputButton], role: 'part:@sanity/components/buttons/in-input'}
  )
