import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

import {ErrorCard} from '../../../../packages/sanity/src/presentation/components/ErrorCard'
import {OpenPreviewButton} from '../../../../packages/sanity/src/presentation/preview/OpenPreviewButton'
// QRCodeSVG is a DEFAULT export (it is a vendored fork of qrcode.react, which exports that way),
// unlike every other component in this storybook. Named-importing it fails at module evaluation
// with "does not provide an export named 'QRCodeSVG'" rather than at type-check time.
import QRCodeSVG from '../../../../packages/sanity/src/presentation/preview/QRCodeSVG'
import {WithStudioProviders} from '../../lib/testProvider'

const noop = () => undefined

const meta: Meta = {
  title: 'Overlays & Navigation/Preview Chrome',
  decorators: [WithStudioProviders()],
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'The error card is the interesting one of these three pieces, because of a button it ' +
            'only sometimes shows: a preview that fails to connect gets one way back in, but a ' +
            'preview that connected and failed a safety check gets a second, riskier one, because ' +
            'the tool admits its own check might be wrong.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/presentation/` |',
          '| Tier | CHROME |',
          '| Patterns | `error-messages` |',
          '',
          'Three isolated pieces of the Presentation tool: the error state that replaces a preview that will not load, the QR code for opening that preview on a phone, and the button that opens it in a new tab. The Presentation tool itself is out of scope for a storybook: `Preview` needs a live iframe and a comlink connection to a running front end. These three are the parts that do not.',
          '',
          "> **Why it matters:** a preview that fails to connect gets Retry; a preview that connected but failed a check gets Retry and Continue anyway, the second in critical tone. That second button is an admission that the tool's own safety check can be wrong, a preview URL might be perfectly fine and simply fail a CORS probe, and rather than trap the person behind a check it cannot fully trust, it lets them past while marking the exit as risky. Very few error screens in this codebase offer a way through. This one does, and tones it accordingly.",
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:overlays',
    'pattern:error-messages',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj

export const ErrorNoActions: Story = {
  name: 'ErrorCard - message only',
  parameters: {
    docs: {
      description: {
        story:
          'The bare form. A title, the underlying message, and nothing to do about it - the shape used when the failure is in configuration rather than in the connection.',
      },
    },
  },
  render: () => (
    <Card border radius={2} style={{height: 320}}>
      <ErrorCard message="The preview URL is not configured for this workspace." />
    </Card>
  ),
}

export const ErrorWithRetry: Story = {
  name: 'ErrorCard - retry',
  parameters: {
    docs: {
      description: {
        story:
          'A transient failure: the preview did not respond. One ghost-toned Retry, because retrying is both safe and likely to work.',
      },
    },
  },
  render: () => (
    <Card border radius={2} style={{height: 320}}>
      <ErrorCard
        message="Could not connect to the preview at https://studio.example.com/preview."
        onRetry={noop}
      />
    </Card>
  ),
}

export const ErrorWithBothActions: Story = {
  name: 'ErrorCard - retry, or continue anyway',
  parameters: {
    docs: {
      description: {
        story: [
          'Both buttons, and the tone difference is the message. Retry is neutral; **Continue ' +
            'anyway** is critical, because the check that failed exists for a reason and going ' +
            'past it may not work.',
          '',
          'The layout switches with the number of actions: two buttons go inline in a row, ' +
            'one sits alone in a `Box`. Small thing, but it means a single action never looks ' +
            'like half of a pair with the other one missing.',
        ].join('\n'),
      },
    },
  },
  render: () => (
    <Card border radius={2} style={{height: 340}}>
      <ErrorCard
        message="The preview responded, but the connection could not be verified."
        onRetry={noop}
        onContinueAnyway={noop}
      >
        <Card border radius={2} padding={3} tone="caution">
          <Text size={1} muted>
            Children render between the message and the actions - the real tool uses this for
            configuration hints.
          </Text>
        </Card>
      </ErrorCard>
    </Card>
  ),
}

export const QRCode: Story = {
  name: 'QRCodeSVG',
  parameters: {
    docs: {
      description: {
        story:
          'A fork of `qrcode.react`, vendored into the studio and rendered as SVG rather than canvas. SVG matters here: the code scales to any size without re-encoding, stays crisp on a high-density display, and inherits the theme rather than needing a light background painted under it.\n\nIt exists so an editor can point a phone at their screen and open the preview on a real device, which is the one thing a desktop preview pane cannot show them.',
      },
    },
  },
  render: () => (
    <Flex gap={5} align="flex-end" wrap="wrap">
      {[96, 128, 192].map((size) => (
        <Stack key={size} gap={3} style={{textAlign: 'center'}}>
          <Card padding={3} radius={2} style={{background: '#fff'}}>
            <QRCodeSVG value="https://studio.example.com/preview?path=/blog/hello" size={size} />
          </Card>
          <Text size={0} muted>
            {size}px
          </Text>
        </Stack>
      ))}
    </Flex>
  ),
}

export const QRCodeErrorLevels: Story = {
  name: 'QRCodeSVG - error correction levels',
  parameters: {
    docs: {
      description: {
        story:
          'The same URL at four error-correction levels. Higher correction survives more damage - a scuffed screen, a bad camera angle - at the cost of a denser code. Look at the module count climbing from L to H.\n\nFor a code being scanned off a monitor a metre away, the low levels are usually enough; the reason to know the control exists is that a denser code is harder to scan at small sizes, so raising correction can make scanning *worse* rather than better.',
      },
    },
  },
  render: () => (
    <Flex gap={4} wrap="wrap">
      {(['L', 'M', 'Q', 'H'] as const).map((level) => (
        <Stack key={level} gap={3} style={{textAlign: 'center'}}>
          <Card padding={3} radius={2} style={{background: '#fff'}}>
            <QRCodeSVG
              value="https://studio.example.com/preview?path=/blog/hello"
              size={110}
              level={level}
            />
          </Card>
          <Text size={0} muted>
            level {level}
          </Text>
        </Stack>
      ))}
    </Flex>
  ),
}

export const OpenPreview: Story = {
  name: 'OpenPreviewButton',
  parameters: {
    docs: {
      description: {
        story:
          "An icon button that opens the preview in a new tab. What it really is, is a **URL builder**: it takes the preview origin and route and appends the studio's current perspective as a search param, so the tab that opens shows the same view of the content you are looking at in the studio.\n\nHover it, then read the two variants below. Without that param the new tab would show published content while the studio showed a release, and the difference would be silent - the page would simply look wrong in a way nothing on screen explains.\n\nNote also `tooltipProps={null}` on the inner Button: the component wraps itself in its own `Tooltip` and switches the shared one off, so hovering produces one tooltip rather than two fighting.",
      },
    },
  },
  render: () => (
    <Stack gap={5}>
      <Stack gap={3}>
        <Text size={0} muted>
          viewing drafts
        </Text>
        <Card border radius={2} padding={2} style={{width: 'fit-content'}}>
          <OpenPreviewButton
            openPopup={noop}
            previewLocationOrigin="https://example.com"
            previewLocationRoute="/blog/hello"
            perspective="drafts"
            variant={undefined}
            targetOrigin="https://example.com"
          />
        </Card>
      </Stack>
      <Stack gap={3}>
        <Text size={0} muted>
          viewing published
        </Text>
        <Card border radius={2} padding={2} style={{width: 'fit-content'}}>
          <OpenPreviewButton
            openPopup={noop}
            previewLocationOrigin="https://example.com"
            previewLocationRoute="/blog/hello"
            perspective="published"
            variant={undefined}
            targetOrigin="https://example.com"
          />
        </Card>
      </Stack>
      <Text size={0} muted>
        Inspect the two anchors: the same route, different `sanity-preview-perspective` values.
      </Text>
    </Stack>
  ),
}
