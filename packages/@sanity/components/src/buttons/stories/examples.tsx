import ComposeIcon from 'part:@sanity/base/compose-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import ButtonGrid from 'part:@sanity/components/buttons/button-grid'
import Button from 'part:@sanity/components/buttons/default'
import DropDownButton from 'part:@sanity/components/buttons/dropdown'
import IntentButton from 'part:@sanity/components/buttons/intent'
import {action} from 'part:@sanity/storybook/addons/actions'
import {boolean} from 'part:@sanity/storybook/addons/knobs'
import {Container, DebugRouterProvider} from 'part:@sanity/storybook/components'
import React from 'react'

const preventDefault = evt => evt.preventDefault()

const items = [
  {index: '1', title: 'Test'},
  {index: '2', title: 'Test 2'},
  {index: '3', title: 'Test 3'},
  {index: '4', title: 'Test 4'},
  {index: '5', title: 'Test 5'},
  {index: '6', title: 'Test 6'},
  {index: '7', title: 'Test 7'},
  {index: '8', title: 'Test 8'},
  {index: '9', title: 'Test 9'},
  {index: '10', title: 'Test 10'},
  {index: '11', title: 'Test 11'}
]

export function ExamplesStory() {
  const disabled = boolean('Disabled', false)
  const loading = boolean('Loading', false)

  return (
    <DebugRouterProvider>
      <Container as="form">
        <h2>Default</h2>
        Some text
        <Button onClick={action('clicked')} disabled={disabled} loading={loading}>
          Default
        </Button>
        between
        <Button
          onClick={action('onClick')}
          icon={SanityLogoIcon}
          disabled={disabled}
          loading={loading}
        >
          Default with icon
        </Button>
        <Button
          onClick={action('onClick')}
          icon={SanityLogoIcon}
          inverted
          disabled={disabled}
          loading={loading}
        >
          Inverted
        </Button>
        <Button
          onClick={action('onClick')}
          icon={SanityLogoIcon}
          kind="simple"
          disabled={disabled}
          loading={loading}
        >
          Simple
        </Button>
        <h2>Colors</h2>
        <ButtonGrid>
          <Button onClick={action('onClick')} disabled={disabled} loading={loading}>
            Undefined
          </Button>
          <Button onClick={action('onClick')} color="primary" disabled={disabled} loading={loading}>
            Primary
          </Button>
          <Button onClick={action('onClick')} color="danger" disabled={disabled} loading={loading}>
            Danger
          </Button>
          <Button onClick={action('onClick')} color="success" disabled={disabled} loading={loading}>
            Success
          </Button>
        </ButtonGrid>
        <h2>Colors (inverted)</h2>
        <Button onClick={action('onClick')} inverted disabled={disabled} loading={loading}>
          Undefined
        </Button>
        <Button
          onClick={action('onClick')}
          color="primary"
          inverted
          disabled={disabled}
          loading={loading}
        >
          Primary
        </Button>
        <Button
          onClick={action('onClick')}
          color="danger"
          inverted
          disabled={disabled}
          loading={loading}
        >
          Danger
        </Button>
        <Button
          onClick={action('onClick')}
          color="success"
          inverted
          disabled={disabled}
          loading={loading}
        >
          Success
        </Button>
        <DropDownButton
          items={items}
          onAction={action('onClick')}
          disabled={disabled}
          loading={loading}
          color="primary"
          inverted
        >
          Dropdown
        </DropDownButton>
        <h2>Colors (simple)</h2>
        <Button onClick={action('onClick')} kind="simple" disabled={disabled} loading={loading}>
          Undefined
        </Button>
        <Button
          onClick={action('onClick')}
          kind="simple"
          color="primary"
          disabled={disabled}
          loading={loading}
        >
          Primary
        </Button>
        <Button
          onClick={action('onClick')}
          kind="simple"
          color="danger"
          disabled={disabled}
          loading={loading}
        >
          Danger
        </Button>
        <Button
          onClick={action('onClick')}
          kind="simple"
          color="success"
          disabled={disabled}
          loading={loading}
        >
          Success
        </Button>
        <h2>With icons</h2>
        <Button
          onClick={action('onClick')}
          icon={SanityLogoIcon}
          disabled={disabled}
          loading={loading}
        >
          With icon
        </Button>
        <Button
          onClick={action('onClick')}
          color="danger"
          icon={SanityLogoIcon}
          disabled={disabled}
          loading={loading}
        >
          Colored with icon
        </Button>
        <Button
          onClick={action('onClick')}
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
          onAction={action('onAction')}
          disabled={disabled}
          loading={loading}
        >
          Dropdown
        </DropDownButton>
        <h2>Only icons</h2>
        <Button
          onClick={action('onClick')}
          icon={SanityLogoIcon}
          title="Default"
          disabled={disabled}
          loading={loading}
        />
        <Button
          onClick={action('onClick')}
          icon={SanityLogoIcon}
          color="danger"
          title="Danger"
          disabled={disabled}
          loading={loading}
        />
        <Button
          onClick={action('onClick')}
          icon={SanityLogoIcon}
          inverted
          title="Inverted"
          disabled={disabled}
          loading={loading}
        />
        <Button
          onClick={action('onClick')}
          icon={SanityLogoIcon}
          inverted
          color="danger"
          title="Inverted danger"
          disabled={disabled}
          loading={loading}
        />
        <Button
          onClick={action('onClick')}
          icon={SanityLogoIcon}
          kind="simple"
          title="Simple"
          disabled={disabled}
          loading={loading}
        />
        <Button
          onClick={action('onClick')}
          icon={SanityLogoIcon}
          kind="simple"
          color="danger"
          title="Simple danger"
          disabled={disabled}
          loading={loading}
        />
        <Button
          onClick={action('onClick')}
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
          icon={ComposeIcon}
          title="Default"
          disabled={disabled}
          loading={loading}
        />
        <IntentButton
          intent="create"
          params={{type: 'book'}}
          onClick={preventDefault}
          icon={ComposeIcon}
          color="danger"
          title="Danger"
          disabled={disabled}
        />
        <IntentButton
          intent="create"
          params={{type: 'book'}}
          onClick={preventDefault}
          icon={ComposeIcon}
          inverted
          title="Inverted"
          disabled={disabled}
          loading={loading}
        />
        <IntentButton
          intent="create"
          params={{type: 'book'}}
          onClick={preventDefault}
          icon={ComposeIcon}
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
          icon={ComposeIcon}
          kind="simple"
          title="Simple"
          disabled={disabled}
          loading={loading}
        />
        <IntentButton
          intent="create"
          params={{type: 'book'}}
          onClick={preventDefault}
          icon={ComposeIcon}
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
          icon={ComposeIcon}
          kind="simple"
          color="primary"
          title="Simple primary"
          disabled={disabled}
          loading={loading}
        />
        <h2>On color areas</h2>
        <div style={{backgroundColor: 'red', padding: '1rem'}}>
          <Button onClick={action('onClick')} color="white" disabled={disabled} loading={loading}>
            White
          </Button>
          <Button
            onClick={action('onClick')}
            kind="simple"
            color="white"
            disabled={disabled}
            loading={loading}
          >
            White simple
          </Button>
          <Button onClick={action('onClick')} inverted disabled={disabled} loading={loading}>
            Inverted
          </Button>
          <Button
            onClick={action('onClick')}
            inverted
            color="white"
            disabled={disabled}
            loading={loading}
          >
            White inverted
          </Button>
        </div>
      </Container>
    </DebugRouterProvider>
  )
}
