import {ArrowLeftIcon, RestoreIcon} from '@sanity/icons'
import {Box, Flex, Text, Stack, Container} from '@sanity/ui'
import React from 'react'
import {Button} from 'sanity/ui-components'
import {PaneContent} from '../../../PaneContent'
import {PaneFooter} from '../../../PaneFooter'
import {PaneHeader} from '../../../PaneHeader'
import {usePaneLayout} from '../../../usePaneLayout'
import {DocumentActions} from './DocumentActions'

export function DocumentViewPanel(props: {
  onBackClick: () => void
  reviewChanges: boolean
  title: string
  toggleReviewChanges: () => void
}) {
  const {onBackClick, reviewChanges, title, toggleReviewChanges} = props
  const {collapsed: layoutCollapsed} = usePaneLayout()

  return (
    <Flex
      direction="column"
      flex={2}
      height="fill"
      overflow={layoutCollapsed ? undefined : 'hidden'}
    >
      <PaneHeader
        backButton={
          layoutCollapsed && (
            <Button
              icon={ArrowLeftIcon}
              mode="bleed"
              onClick={onBackClick}
              tooltipProps={{content: 'Back'}}
            />
          )
        }
        title={title}
      />
      <PaneContent>
        <Box
          height={layoutCollapsed ? undefined : 'fill'}
          overflow={layoutCollapsed ? undefined : 'auto'}
        >
          <Container width={1}>
            <Stack padding={4} space={4}>
              <Text as="p" muted>
                Lorem ipsum dolor <a href="#">sit amet</a>, consectetur adipiscing elit. Donec vitae
                odio tellus. Etiam non metus at ante varius viverra. Pellentesque in iaculis lectus.
                Mauris laoreet et dui quis rhoncus. Quisque tempus velit tellus. In vel maximus
                quam. Vestibulum eu interdum diam. Aliquam luctus mattis justo, lacinia accumsan
                nunc tincidunt ac. Curabitur molestie malesuada velit et venenatis. Ut eget nunc sit
                amet ligula dapibus vehicula ut sed velit. Donec eget erat consectetur, scelerisque
                nibh nec, fermentum ipsum. Nulla at erat eu felis fermentum pellentesque.
              </Text>
              <Text as="p" muted>
                Suspendisse lacinia mi nibh, sit amet ultricies neque vulputate eget. Vivamus nisl
                augue, sodales vitae velit ac, vehicula dignissim leo. Suspendisse ornare efficitur
                porttitor. Cras placerat, augue in tempus malesuada, urna dolor volutpat erat, vitae
                pulvinar odio sapien sed odio. Nulla est enim, rutrum sit amet felis non, blandit
                tempus lectus. Pellentesque nulla tellus, fermentum vel mauris vitae, efficitur
                tincidunt nulla. Etiam venenatis ante ac condimentum porta. Praesent vel ornare ex.
                Fusce scelerisque, dolor quis faucibus bibendum, mi tortor gravida velit, id blandit
                ante nisl nec mauris. Donec ultrices interdum ipsum. Vestibulum venenatis malesuada
                quam, quis porta elit. Donec volutpat massa quis dolor fermentum lobortis. Morbi
                quis eros at lectus ornare aliquet.
              </Text>
              <Text as="p" muted>
                Interdum et malesuada fames ac ante ipsum primis in faucibus. Maecenas dictum velit
                in nunc pretium, in gravida elit faucibus. Vivamus at porta turpis, a suscipit eros.
                Donec sit amet mattis risus. Pellentesque auctor est id leo efficitur, eu eleifend
                diam suscipit. Nulla nec congue ante. Praesent elementum dolor felis, in dignissim
                massa tincidunt nec. Duis consectetur congue commodo. Quisque id facilisis dui.
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </Text>
              <Text as="p" muted>
                Donec a tristique turpis. Pellentesque eleifend eu libero ac laoreet. Fusce volutpat
                hendrerit ex. Suspendisse ornare tempor est nec faucibus. Morbi semper ullamcorper
                arcu nec elementum. Nam sagittis tempor sapien, nec blandit ante lacinia id.
                Vestibulum dapibus odio quam, eu placerat diam pulvinar eu. Nulla posuere dolor
                volutpat, facilisis felis ac, tristique nulla. Mauris eget luctus ex. Curabitur at
                imperdiet metus. Donec rutrum dui ac viverra vulputate. Curabitur aliquam erat quis
                turpis lobortis sollicitudin. Integer ut eleifend lectus.
              </Text>
              <Text as="p" muted>
                In hac habitasse platea dictumst. Maecenas venenatis nisi est, auctor efficitur nisi
                lacinia nec. Nam condimentum elit quis est mattis, eu fermentum neque feugiat. Nulla
                arcu neque, porttitor varius vulputate bibendum, facilisis sed nisi. Praesent id
                urna id lacus scelerisque convallis sed vel quam. Vestibulum est massa, sollicitudin
                eget ipsum et, porta pellentesque magna. Cras vulputate semper odio at facilisis.
                Mauris eget purus congue, sollicitudin nisi sed, euismod dui.
              </Text>
            </Stack>
          </Container>
        </Box>
      </PaneContent>

      <PaneFooter padding={2}>
        <Flex>
          <Box flex={1}>
            <Button
              disabled={layoutCollapsed}
              icon={RestoreIcon}
              mode="bleed"
              onClick={toggleReviewChanges}
              selected={reviewChanges}
              tooltipProps={{content: "Review document's history"}}
            />
          </Box>
          <Box flex={1} style={{maxWidth: '260px'}}>
            <DocumentActions />
          </Box>
        </Flex>
      </PaneFooter>
    </Flex>
  )
}
