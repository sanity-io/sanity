import {ChevronDownIcon} from '@sanity/icons'
import {Container, Stack, TabList, Text} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import React, {useMemo} from 'react'
import {Button, Tab} from '../../../../ui'
import {Pane} from '../Pane'
import {PaneContent} from '../PaneContent'
import {PaneFooter} from '../PaneFooter'
import {PaneHeader} from '../PaneHeader'
import {PaneLayout} from '../PaneLayout'
import {ContextMenuButton} from 'sanity'

const PANE_TONE_OPTIONS = {
  Default: 'default',
  Primary: 'primary',
  Positive: 'positive',
  Caution: 'caution',
  Critical: 'critical',
} as const

export default function ExampleStory() {
  const layoutCollapsed = useBoolean('Layout collapsed', false, 'Props')
  const manyTabs = useBoolean('Many tabs', false, 'Props')
  const tone = useSelect('Tone', PANE_TONE_OPTIONS, 'default', 'Props')

  const actions = useMemo(() => <ContextMenuButton />, [])
  const tabs = useMemo(
    () =>
      manyTabs ? (
        <TabList space={1}>
          <Tab aria-controls="content-panel" id="content-tab" label="Content" selected />
          <Tab aria-controls="preview-panel" id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" id="preview-tab" label="Preview" />
        </TabList>
      ) : (
        <TabList space={1}>
          <Tab aria-controls="content-panel" id="content-tab" label="Content" selected />
          <Tab aria-controls="preview-panel" id="preview-tab" label="Preview" />
        </TabList>
      ),
    [manyTabs],
  )

  return (
    <PaneLayout height={layoutCollapsed ? undefined : 'fill'} style={{minHeight: '100%'}}>
      <Pane id="example-pane" minWidth={320} tone={tone}>
        <PaneHeader
          actions={actions}
          subActions={<Button iconRight={ChevronDownIcon} mode="bleed" text="Latest" />}
          tabs={tabs}
          title={<>Header</>}
        />
        <PaneContent overflow="auto">
          <Container paddingX={4} paddingY={[4, 4, 5]} sizing="border" width={1}>
            <Stack space={4}>
              <Text muted>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut lobortis est sed mi
                aliquam, non tincidunt nisl suscipit. Aenean sodales scelerisque lobortis.
                Pellentesque vitae nunc accumsan, elementum nisl at, commodo arcu. Sed ac est in
                mauris venenatis lacinia. Aliquam eget metus ligula. Nunc viverra nulla erat, sed
                mollis lectus auctor rhoncus. Curabitur aliquet molestie lacus, nec suscipit odio
                eleifend sit amet. Class aptent taciti sociosqu ad litora torquent per conubia
                nostra, per inceptos himenaeos. Donec condimentum nulla a nunc elementum varius.
                Vestibulum id nibh vitae nisl vestibulum luctus non dapibus urna. Sed semper metus
                ac scelerisque molestie. Cras mi turpis, vestibulum vel ultrices sit amet, imperdiet
                vel tortor.
              </Text>
              <Text muted>
                Curabitur vel viverra nunc. Mauris vel tellus a ante porta aliquet. Nam in est
                augue. Nullam lacinia sapien sit amet placerat consequat. Vivamus aliquam in orci in
                semper. Integer vehicula elementum ante et gravida. Suspendisse commodo sodales quam
                dignissim lobortis. Praesent ultrices elit in orci vehicula, at sollicitudin nisl
                venenatis. Nunc porttitor risus ac leo auctor rhoncus. Proin pharetra posuere
                commodo. Vivamus vel elementum magna, quis iaculis justo. Donec nisl mauris, blandit
                a augue nec, elementum vulputate lacus. Donec sodales ipsum in ante ultricies,
                bibendum tincidunt massa pharetra.
              </Text>
              <Text muted>
                Phasellus et purus id nisl efficitur luctus eu id risus. Phasellus lacinia efficitur
                quam. Nulla id malesuada quam. Cras a nibh ut felis tincidunt mattis. Maecenas sit
                amet massa et ex tincidunt elementum. Nam vehicula eu dolor sed ornare. Vestibulum
                rhoncus diam non imperdiet pellentesque. Cras lacinia, diam eget efficitur
                ullamcorper, quam sem accumsan nibh, ac pulvinar tortor risus id neque. In gravida
                felis lectus, nec scelerisque ante ornare euismod. Quisque vitae nibh commodo,
                cursus erat vel, eleifend urna. Nullam eu commodo ante.
              </Text>
              <Text muted>
                Nam est magna, viverra eu justo id, pretium rutrum felis. Sed ligula diam, aliquam
                eget quam at, posuere luctus sem. Pellentesque tempus tincidunt sagittis. Donec ac
                ante placerat erat semper hendrerit vel at turpis. Etiam facilisis, neque placerat
                congue congue, mauris nulla sagittis massa, non blandit leo dui facilisis dolor.
                Suspendisse vitae volutpat felis, in interdum massa. In hac habitasse platea
                dictumst. Cras pellentesque semper enim. Nunc varius magna sit amet faucibus
                feugiat. In hac habitasse platea dictumst. Maecenas eu nisi bibendum, malesuada leo
                vitae, accumsan tellus. Etiam fermentum ipsum a erat eleifend, eu ultrices nibh
                semper.
              </Text>
              <Text muted>
                Phasellus facilisis, enim eu consectetur placerat, neque purus luctus diam, eget
                lobortis lacus tellus quis mi. Etiam ex augue, fermentum eget ligula in, tincidunt
                mollis erat. Ut in rhoncus tortor. Fusce faucibus ullamcorper justo, eu semper massa
                faucibus eu. Donec sed mauris non ligula placerat cursus. In et dui faucibus,
                eleifend sem nec, scelerisque urna. Nunc mollis eros vitae egestas facilisis. Duis
                ut metus interdum, ultrices magna non, imperdiet dui. Etiam mattis et ex varius
                aliquet. Ut vestibulum dolor est, ut aliquam diam ullamcorper sit amet. Cras ac urna
                quis augue tincidunt aliquam ut at augue. Mauris et sapien vitae lacus molestie
                fringilla. Vivamus eu finibus mauris. Nulla dignissim tincidunt nulla, a egestas sem
                dignissim id. Pellentesque sit amet magna ac dolor laoreet placerat eu a massa.
              </Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
              <Text muted>Content</Text>
            </Stack>
          </Container>
        </PaneContent>
        <PaneFooter padding={4}>
          <Text muted>Footer</Text>
        </PaneFooter>
      </Pane>
    </PaneLayout>
  )
}
