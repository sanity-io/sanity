import {CloseIcon} from '@sanity/icons/Close'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {TrashIcon} from '@sanity/icons/Trash'
import noop from 'lodash-es/noop.js'
import {Box, Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {Button} from '../../../../ui-components/button/Button'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {Body} from '../Body'
import {Container} from '../Container'
import {DocumentGroupFilter} from '../DocumentGroupFilter'
import {Footer} from '../Footer'
import {Header} from '../Header'
import {TextButton} from '../TextButton'
import {StatusBadge} from '../VariantSet/StatusBadge'
import {VariantCheckbox} from '../VariantSet/VariantCheckbox'
import {VariantSet} from '../VariantSet/VariantSet'
import {VariantSetEntry} from '../VariantSet/VariantSetEntry'
import {VariantSetHeader} from '../VariantSet/VariantSetHeader'

const ROWS = [
  {name: 'Published', release: 'published', selected: false, checked: true},
  {name: 'Draft', release: 'drafts', selected: true, checked: false},
  {name: 'Summer sale', release: 'rSummer', selected: false, checked: false},
] as const

function Row(props: {name: string; release: string; selected: boolean; checked: boolean}) {
  const {name, release, selected, checked} = props
  return (
    <VariantSetEntry data-variant-name={name} data-selected={selected || undefined}>
      <div className="atom">
        <button type="button" className="primary-action" onClick={noop}>
          {name}
        </button>
        <VariantCheckbox checked={checked} readOnly />
        <Text size={1} weight="medium" className="inert" as="div" trim={true}>
          {name}
        </Text>
      </div>
      <div className="atom inert">
        {selected && (
          <StatusBadge radius={2} tone="primary">
            <EyeOpenIcon /> Viewing
          </StatusBadge>
        )}
        <ReleaseAvatarIcon release={release} />
      </div>
    </VariantSetEntry>
  )
}

/**
 * The styled shell of the document group inventory popover, composed the way
 * `DocumentGroupInventory` lays it out: `Container` grid, `Header` with the close `TextButton`
 * and the `DocumentGroupFilter`, the scroll-masked `Body` holding a `VariantSet` with its
 * `VariantSetHeader` and `VariantSetEntry` rows (one carrying the "Viewing" `StatusBadge`), and
 * the `Footer` with the cancel and delete buttons. The second column repeats the filter in
 * read-only mode and a bare `StatusBadge`.
 */
export function InventoryChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Flex gap={4} alignItems="flex-start" flexWrap="wrap">
        <Box style={{maxWidth: 420}}>
          <Container>
            <Header>
              <VStack gap={4}>
                <Flex gap={4} alignItems="center" justifyContent="flex-end">
                  <TextButton onClick={noop} title="Close" aria-label="Close">
                    <Text size={1}>
                      <CloseIcon />
                    </Text>
                  </TextButton>
                </Flex>
                <DocumentGroupFilter onChange={noop} value="" />
              </VStack>
            </Header>
            <Body>
              <VariantSet data-variant-set="All users (Default)">
                <VariantSetHeader as="header">
                  <Text size={1} weight="semibold" as="div" trim={true}>
                    All users (Default)
                  </Text>
                  <TextButton onClick={noop}>
                    <Text size={1}>Select all 3</Text>
                  </TextButton>
                </VariantSetHeader>
                {ROWS.map((row) => (
                  <Row key={row.name} {...row} />
                ))}
              </VariantSet>
            </Body>
            <Footer>
              <Button text="Cancel" size="large" mode="bleed" onClick={noop} />
              <Button
                text="Delete 1 version"
                onClick={noop}
                tone="critical"
                size="large"
                icon={TrashIcon}
              />
            </Footer>
          </Container>
        </Box>
        <VStack gap={3} style={{width: 240}}>
          <DocumentGroupFilter onChange={noop} readOnly value="summer" />
          <Flex>
            <StatusBadge radius={2} tone="primary">
              <EyeOpenIcon /> Viewing
            </StatusBadge>
          </Flex>
        </VStack>
      </Flex>
    </TestWrapper>
  )
}
