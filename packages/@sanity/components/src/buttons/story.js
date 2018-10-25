import React from 'react'

import {RouterProvider, route} from 'part:@sanity/base/router'
import Button from 'part:@sanity/components/buttons/default'
import AnchorButton from 'part:@sanity/components/buttons/anchor'
import IntentButton from 'part:@sanity/components/buttons/intent'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
// import DefaultFormField from 'part:@sanity/components/formfields/default'
// import DefaultTextInput from 'part:@sanity/components/textinputs/default'
// import InInputButton from 'part:@sanity/components/buttons/in-input'
// import InInputStyles from 'part:@sanity/components/buttons/in-input-style'
import {storiesOf} from 'part:@sanity/storybook'
import Chance from 'chance'
import {range} from 'lodash'

import {
  withKnobs,
  text,
  select,
  boolean,
  object,
  number,
  button,
  color
} from 'part:@sanity/storybook/addons/knobs'
import PlusIcon from 'part:@sanity/base/plus-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'

import Sanity from 'part:@sanity/storybook/addons/sanity'
import ButtonCollection from 'part:@sanity/components/buttons/button-collection'

const chance = new Chance()

const handleNavigate = () => {
  /* intentional noop */
}
const router = route('/', [route('/bikes/:bikeId'), route.intents('/intents')])
const preventDefault = evt => evt.preventDefault()
const getButtonKinds = () => select('kind', ['default', 'simple', 'secondary'], 'default', 'props')
const getColorKinds = () =>
  select('color', [false, 'primary', 'success', 'danger', 'white'], false, 'props')

const items = [
  {index: '1', title: 'Test'},
  {index: '2', title: 'Test 2'},
  {index: '3', title: 'Test 3'},
  {index: '4', title: 'Test 4'},
  {index: '5', title: 'Test 5'},
  {index: '6', title: 'Test 6'},
  {index: '7', title: 'Test 7'}
]

function action(something) {
  return () => console.log('action', something)
}

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

storiesOf('Buttons', module)
  .addDecorator(withKnobs)
  .add('Default', () => {
    let testElement = null

    function testFocus() {
      testElement.focus()
    }

    function setConfirmButton(element) {
      testElement = element
    }
    const backgroundColor = color('View color', '#fff', 'test')
    button('Test focus', () => testFocus(), 'test')
    return (
      <div style={{backgroundColor, ...centerStyle}}>
        <Sanity part="part:@sanity/components/buttons/default" propTables={[Button]}>
          <Button
            kind={getButtonKinds()}
            onClick={action('clicked')}
            disabled={boolean('disabled', false, 'props')}
            inverted={boolean('inverted', false, 'props')}
            onFocus={action('onFocus')}
            onBlur={action('onBlur')}
            color={getColorKinds()}
            loading={boolean('loading', false, 'props')}
            icon={boolean('icon', false, 'props') ? SanityLogoIcon : false}
            ref={setConfirmButton}
          >
            {text('children', 'Touch Me!', 'props')}
          </Button>
        </Sanity>
      </div>
    )
  })
  .add('Anchor <a>', () => {
    const backgroundColor = color('View color', '#fff', 'test')
    return (
      <div style={{backgroundColor, ...centerStyle}}>
        <Sanity part="part:@sanity/components/buttons/anchor" propTables={[Button]}>
          <AnchorButton
            kind={getButtonKinds()}
            onClick={action('clicked')}
            disabled={boolean('disabled', false, 'props')}
            inverted={boolean('inverted', false, 'props')}
            onFocus={action('onFocus')}
            onBlur={action('onBlur')}
            color={getColorKinds()}
            loading={boolean('loading', false, 'props')}
            icon={boolean('icon', false, 'props') ? SanityLogoIcon : false}
            href={text('href', 'http://example.org', 'props')}
          >
            {text('children', 'Touch Me!', 'props')}
          </AnchorButton>
        </Sanity>
      </div>
    )
  })
  .add('DropDownButton', () => {
    const backgroundColor = color('View color', '#fff', 'test')
    return (
      <div style={{backgroundColor, ...centerStyle}}>
        <Sanity part="part:@sanity/components/buttons/dropdown" propTables={[DropDownButton]}>
          <RouterProvider
            router={router}
            onNavigate={handleNavigate}
            state={router.decode(location.pathname)}
          >
            <DropDownButton
              items={object('items', items, 'props')}
              onAction={action('Clicked item')}
              color={getColorKinds()}
              kind={getButtonKinds()}
              onClick={action('clicked')}
              disabled={boolean('disabled', false, 'props')}
              inverted={boolean('inverted', false, 'props')}
              onFocus={action('onFocus')}
              onBlur={action('onBlur')}
              loading={boolean('loading', false, 'props')}
              icon={boolean('icon', false, 'props') ? SanityLogoIcon : false}
            >
              {text('prop: children', 'This is a dropdown')}
            </DropDownButton>
          </RouterProvider>
        </Sanity>
      </div>
    )
  })
  .add('Button', () => {
    return (
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/fileinput/button" propTables={[FileInputButton]}>
          <FileInputButton onSelect={action('onSelect')}>Upload file…</FileInputButton>
        </Sanity>
      </div>
    )
  })

  .add('Button collection', () => {
    const backgroundColor = color('View color', '#fff', 'test')
    return (
      <div style={{padding: '2rem', backgroundColor}}>
        <ButtonCollection>
          <Button onClick={action('clicked')}>Undefined</Button>
          <Button onClick={action('clicked')} color="primary">
            Primary
          </Button>
          <Button onClick={action('clicked')} color="danger">
            Danger
          </Button>
          <Button onClick={action('clicked')} color="success">
            Success
          </Button>
          <Button onClick={action('clicked')} icon={SanityLogoIcon} color="danger" title="Danger" />
          <Button onClick={action('clicked')} icon={SanityLogoIcon} inverted title="Inverted" />
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            inverted
            color="danger"
            title="Inverted danger"
          />
          <Button onClick={action('clicked')} icon={SanityLogoIcon} kind="simple" title="Simple" />
        </ButtonCollection>
      </div>
    )
  })
  .add('Examples', () => {
    const disabled = boolean('Disabled', false)
    const loading = boolean('Loading', false)
    const fontSize = number('FontSize (rem)', 1, {range: true, min: 0.5, max: 3, step: 0.25})
    const backgroundColor = color('View color', '#fff', 'test')
    return (
      <RouterProvider
        router={router}
        onNavigate={handleNavigate}
        state={router.decode(location.pathname)}
      >
        <form style={{padding: '2rem', fontSize: `${fontSize}rem`, backgroundColor}}>
          <h2>Default</h2>
          <ButtonCollection>
            <Button
              onClick={action('clicked')}
              icon={SanityLogoIcon}
              disabled={disabled}
              loading={loading}
            >
              Default
            </Button>
            <Button
              onClick={action('clicked')}
              icon={SanityLogoIcon}
              inverted
              disabled={disabled}
              loading={loading}
            >
              Inverted
            </Button>
            <Button
              onClick={action('clicked')}
              icon={SanityLogoIcon}
              kind="simple"
              disabled={disabled}
              loading={loading}
            >
              Simple
            </Button>
          </ButtonCollection>
          <h2>Colors</h2>
          <ButtonCollection>
            <Button onClick={action('clicked')} disabled={disabled} loading={loading}>
              Undefined
            </Button>
            <Button
              onClick={action('clicked')}
              color="primary"
              disabled={disabled}
              loading={loading}
            >
              Primary
            </Button>
            <Button
              onClick={action('clicked')}
              color="danger"
              disabled={disabled}
              loading={loading}
            >
              Danger
            </Button>
            <Button
              onClick={action('clicked')}
              color="success"
              disabled={disabled}
              loading={loading}
            >
              Success
            </Button>
          </ButtonCollection>
          <h2>Colors (inverted)</h2>
          <Button onClick={action('clicked')} inverted disabled={disabled} loading={loading}>
            Undefined
          </Button>
          <Button
            onClick={action('clicked')}
            color="primary"
            inverted
            disabled={disabled}
            loading={loading}
          >
            Primary
          </Button>
          <Button
            onClick={action('clicked')}
            color="danger"
            inverted
            disabled={disabled}
            loading={loading}
          >
            Danger
          </Button>
          <Button
            onClick={action('clicked')}
            color="success"
            inverted
            disabled={disabled}
            loading={loading}
          >
            Success
          </Button>
          <DropDownButton
            items={items}
            onAction={action('Clicked item')}
            disabled={disabled}
            loading={loading}
          >
            Dropdown
          </DropDownButton>

          <h2>Colors (simple)</h2>
          <Button onClick={action('clicked')} kind="simple" disabled={disabled} loading={loading}>
            Undefined
          </Button>
          <Button
            onClick={action('clicked')}
            kind="simple"
            color="primary"
            disabled={disabled}
            loading={loading}
          >
            Primary
          </Button>
          <Button
            onClick={action('clicked')}
            kind="simple"
            color="danger"
            disabled={disabled}
            loading={loading}
          >
            Danger
          </Button>
          <Button
            onClick={action('clicked')}
            kind="simple"
            color="success"
            disabled={disabled}
            loading={loading}
          >
            Success
          </Button>

          <h2>With icons</h2>
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            disabled={disabled}
            loading={loading}
          >
            With icon
          </Button>
          <Button
            onClick={action('clicked')}
            color="danger"
            icon={SanityLogoIcon}
            disabled={disabled}
            loading={loading}
          >
            Colored with icon
          </Button>
          <Button
            onClick={action('clicked')}
            color="danger"
            icon={SanityLogoIcon}
            inverted
            disabled={disabled}
            loading={loading}
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
            loading={loading}
          >
            Dropdown
          </DropDownButton>

          <h2>Only icons</h2>
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            title="Default"
            disabled={disabled}
            loading={loading}
          />
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            color="danger"
            title="Danger"
            disabled={disabled}
            loading={loading}
          />
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            inverted
            title="Inverted"
            disabled={disabled}
            loading={loading}
          />
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            inverted
            color="danger"
            title="Inverted danger"
            disabled={disabled}
            loading={loading}
          />
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            kind="simple"
            title="Simple"
            disabled={disabled}
            loading={loading}
          />
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            kind="simple"
            color="danger"
            title="Simple danger"
            disabled={disabled}
            loading={loading}
          />
          <Button
            onClick={action('clicked')}
            icon={SanityLogoIcon}
            kind="simple"
            color="primary"
            title="Simple primary"
            disabled={disabled}
            loading={loading}
          />

          <h2>Intent buttons with only icons</h2>
          <IntentButton
            intent="create"
            params={{type: 'book'}}
            onClick={preventDefault}
            icon={PlusIcon}
            title="Default"
            disabled={disabled}
            loading={loading}
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
            loading={loading}
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
            loading={loading}
          />
          <IntentButton
            intent="create"
            params={{type: 'book'}}
            onClick={preventDefault}
            icon={PlusIcon}
            kind="simple"
            title="Simple"
            disabled={disabled}
            loading={loading}
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
            loading={loading}
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
            loading={loading}
          />

          <h2>On color areas</h2>
          <div style={{backgroundColor: 'red', padding: '1rem'}}>
            <Button onClick={action('clicked')} color="white" disabled={disabled} loading={loading}>
              White
            </Button>
            <Button
              onClick={action('clicked')}
              kind="simple"
              color="white"
              disabled={disabled}
              loading={loading}
            >
              White simple
            </Button>
            <Button onClick={action('clicked')} inverted disabled={disabled} loading={loading}>
              Inverted
            </Button>
            <Button
              onClick={action('clicked')}
              inverted
              color="white"
              disabled={disabled}
              loading={loading}
            >
              White inverted
            </Button>
          </div>
        </form>
      </RouterProvider>
    )
  })

storiesOf('Button collection', module)
  .addDecorator(withKnobs)
  .add('Default', () => {
    const backgroundColor = color('View color', '#fff', 'test')

    return (
      <div style={{backgroundColor, margin: '2rem'}}>
        <Sanity
          part="part:@sanity/components/buttons/button-collection"
          propTables={[ButtonCollection]}
        >
          <ButtonCollection
            align={select('align', ['start', 'end'], 'props')}
            secondary={range(0, number('# secondary', 1)).map(i => {
              return (
                <Button inverted key={i}>
                  {i % 2 ? chance.word() : chance.name()}
                </Button>
              )
            })}
          >
            {range(0, number('# buttons', 2)).map(i => {
              return <Button key={i}>{i % 2 ? chance.word() : chance.name()}</Button>
            })}
          </ButtonCollection>
        </Sanity>
      </div>
    )
  })
