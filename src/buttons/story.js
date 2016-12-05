import React from 'react'

import styles from './styles/story.css'

import Button from 'part:@sanity/components/buttons/default'
import Fab from 'part:@sanity/components/buttons/fab'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import InInputButton from 'part:@sanity/components/buttons/in-input'
import {storiesOf, action} from 'part:@sanity/storybook'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'

storiesOf('Buttons')
  .addWithInfo(
    'Default Button',
    'Standard button Role: part:@sanity/components/buttons/default',
    () => (
      <Button onClick={action('clicked')}>Touch me!</Button>
    ),
    {propTables: [Button], role: 'part:@sanity/components/buttons/default'}
  )
  .addWithInfo(
    'Default Button (disabled)',
    'Standard button Role: part:@sanity/components/buttons/default',
    () => (
      <Button onClick={action('clicked')} disabled>I'm disabled!</Button>
    ),
    {propTables: [Button], role: 'part:@sanity/components/buttons/default'}
  )
  .addWithInfo(
  'Variations',
  '',
  () => (
    <div>
      <h2>Default</h2>
      <Button onClick={action('clicked')}>
        Default
      </Button>
      <Button onClick={action('clicked')} kind="simple">
        Simple
      </Button>
      <Button onClick={action('clicked')} kind="secondary" icon={SanityLogoIcon} inverted>
        Secondary
      </Button>

      <h2>Colors</h2>
      <Button onClick={action('clicked')} color="primary">
        Color:Primary
      </Button>
      <Button onClick={action('clicked')} color="danger">
        Color:Danger
      </Button>
      <Button onClick={action('clicked')} color="danger" inverted>
        Color:Danger inverted
      </Button>
      <Button onClick={action('clicked')} color="success">
        Color:Success
      </Button>
      <Button onClick={action('clicked')} color="success" inverted>
        Color:Success inverted
      </Button>
      <Button onClick={action('clicked')} kind="simple" color="success">
        Simple Color:Success
      </Button>
      <Button onClick={action('clicked')} kind="simple" color="success" inverted>
        Simple Color:Success inverted
      </Button>

      <h2>Inverted</h2>
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
    </div>
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
          <DropDownButton kind="danger" items={items} onAction={action('Clicked item')}>
            This is a dangergrous dropdown
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
          <div className={styles.inputContainer}>
            <div className={styles.input}>
              This is the input
              <InInputButton onAction={action('Clicked item')}>browse</InInputButton>
            </div>
          </div>
          <div className={styles.inputContainer}>
            <div className={styles.input}>
              This is the with danger button
              <InInputButton onAction={action('Clicked item')} kind="danger">delete</InInputButton>
            </div>
          </div>
          <div className={styles.inputContainer}>
            <div className={styles.input}>
              More buttons
              <InInputButton onAction={action('Clicked item')} kind="danger">Delete</InInputButton>
              <InInputButton onAction={action('Clicked item')}>Change</InInputButton>
            </div>
          </div>
        </div>

      )
    },
    {propTables: [DropDownButton], role: 'part:@sanity/components/buttons/dropdown'}
  )

  .addWithInfo(
    'Button group',
    'Buttons that are inside an input field',
    () => {
      return (
        <div>
          <div className={styles.inputContainer}>
            <div className={styles.input}>
              This is the input
              <InInputButton onAction={action('Clicked item')}>browse</InInputButton>
            </div>
          </div>
          <div className={styles.inputContainer}>
            <div className={styles.input}>
              This is the with danger button
              <InInputButton onAction={action('Clicked item')} kind="danger">delete</InInputButton>
            </div>
          </div>
          <div className={styles.inputContainer}>
            <div className={styles.input}>
              More buttons
              <InInputButton onAction={action('Clicked item')} kind="danger">Delete</InInputButton>
              <InInputButton onAction={action('Clicked item')}>Change</InInputButton>
            </div>
          </div>
        </div>

      )
    },
    {propTables: [InInputButton], role: 'part:@sanity/components/buttons/in-input'}
  )
