import {type ObjectField, type Path} from '@sanity/types'
import {Card, Text as UiText} from '@sanity/ui'
import {toString as pathToString} from '@sanity/util/paths'
import {type HTMLProps, type ReactNode} from 'react'
import {Box, Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {ChangeIndicatorsTracker} from '../../changeIndicators/tracker'
import {LocaleProvider} from '../../i18n/components/LocaleProvider'
import {
  CardContainer,
  ContentContainer,
  FlexContainer,
  OverlayContainer,
} from '../components/ActivateOnFocus/ActivateOnFocus.styles'
import {HotspotImageContainer} from '../inputs/files/ImageToolInput/imagetool/HotspotImage.styles'
import {
  CropCornerHandle,
  CropDimensionsBadgeGroup,
  CropDimensionsBadgeRect,
  CropDimensionsBadgeText,
  CropEdgeHandle,
  CropHandleInteractionArea,
  CropRect,
  DarkenedOverlay,
  Guidelines,
  HotspotEllipse,
  HotspotHandle,
  HotspotHandleInteractionArea,
  StyledSVG,
  SVGContainer,
} from '../inputs/files/ImageToolInput/imagetool/ToolSVG.styles'
import {FieldGroupTabs} from '../inputs/ObjectInput/fieldGroups/FieldGroupTabs'
import {StyledChangeIndicatorWithProvidedFullPath} from '../inputs/PortableText/_common/StyledChangeIndicatorWithProvidedFullPath'
import {
  ExpandedLayer,
  Root as CompositorRoot,
  StringDiffContainer,
} from '../inputs/PortableText/Compositor.styles'
import {UnknownValue} from '../inputs/PortableText/text/UnknownValue'
import {ReferenceLinkCard} from '../inputs/ReferenceInput/ReferenceLinkCard'
import {IncompatibleItemType} from '../members/array/IncompatibleItemType'
import {type FormFieldGroup} from '../store/types/fieldGroup'

const noop = () => undefined

const NO_FIELDS: ObjectField[] = []

const FIELD_GROUPS: FormFieldGroup[] = [
  {name: 'all-fields', title: 'All fields', selected: true, fields: NO_FIELDS},
  {name: 'content', title: 'Content', fields: NO_FIELDS},
  {name: 'seo', title: 'SEO', disabled: true, fields: NO_FIELDS},
]

const INCOMPATIBLE_VALUE = {
  _key: 'legacy-1',
  _type: 'legacyBanner',
  title: 'Spring sale banner',
}

const REF_PATH: Path = ['author']

interface LinkProps extends HTMLProps<HTMLAnchorElement> {
  documentId?: string
  documentType?: string
  parentRefPath?: Path
  template?: unknown
}

/**
 * Stands in for the intent link `ReferenceLinkCard` receives through `as`: it
 * takes the reference props the card forwards so they never reach the DOM.
 */
function FixtureLink(props: LinkProps) {
  const {documentId, documentType, parentRefPath, template, children, ...rest} = props
  return (
    <a
      {...rest}
      href="#reference"
      data-document-id={documentId}
      data-document-type={documentType}
      data-parent-ref-path={parentRefPath ? pathToString(parentRefPath) : undefined}
      data-template={template}
    >
      {children}
    </a>
  )
}

function Section(props: {title: string; children: ReactNode}) {
  const {title, children} = props
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {title}
      </Text>
      {children}
    </VStack>
  )
}

/**
 * Styled-components and `@sanity/ui` sentinel for the form's smaller styled
 * primitives: the activate-on-focus overlay styles, the Portable Text
 * compositor root/expanded layer/diff container, the full-height change
 * indicator, the image tool's hotspot and crop SVG styles, the unknown value
 * marker, the field group tabs, the reference link card and the incompatible
 * array item type card. Every value is a static fixture.
 */
export function FormStyledPrimitivesStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <LocaleProvider>
        <ChangeIndicatorsTracker>
          <Card padding={4}>
            <VStack gap={5}>
              <Section title="activate on focus overlay">
                <OverlayContainer>
                  <FlexContainer tabIndex={0} alignItems="center" justifyContent="center">
                    <CardContainer tone="transparent" radius={2} />
                    <ContentContainer>
                      <UiText weight="medium">Click to activate</UiText>
                    </ContentContainer>
                  </FlexContainer>
                  <Card padding={4} border radius={2}>
                    <UiText>Inactive editor content</UiText>
                  </Card>
                </OverlayContainer>
              </Section>

              <Section title="portable text compositor root">
                <CompositorRoot data-focused="">
                  <div data-wrapper="">
                    <Card padding={3} radius={2}>
                      <UiText>Focused compositor</UiText>
                    </Card>
                  </div>
                  <div data-border="" />
                </CompositorRoot>
                <CompositorRoot data-read-only="">
                  <div data-wrapper="">
                    <Card padding={3} radius={2} tone="transparent">
                      <UiText muted>Read-only compositor</UiText>
                    </Card>
                  </div>
                  <div data-border="" />
                </CompositorRoot>
                <Box style={{position: 'relative', height: 80}}>
                  <ExpandedLayer>
                    <Card padding={3} border radius={2} height="fill">
                      <UiText>Expanded layer</UiText>
                    </Card>
                  </ExpandedLayer>
                </Box>
                <StringDiffContainer>
                  <UiText>String diff container</UiText>
                </StringDiffContainer>
              </Section>

              <Section title="full-height change indicator">
                <Flex gap={3} style={{height: 48}}>
                  <StyledChangeIndicatorWithProvidedFullPath
                    path={['body']}
                    hasFocus={false}
                    isChanged
                  />
                  <UiText>Changed block</UiText>
                </Flex>
              </Section>

              <Section title="image tool styles">
                <HotspotImageContainer>
                  <SVGContainer>
                    <StyledSVG width={240} height={160} viewBox="0 0 240 160">
                      <DarkenedOverlay x={0} y={0} width={240} height={160} />
                      <Guidelines>
                        <line x1={0} y1={80} x2={240} y2={80} />
                        <line x1={120} y1={0} x2={120} y2={160} />
                      </Guidelines>
                      <CropRect x={24} y={16} width={192} height={128} $focused />
                      <CropCornerHandle d="M24 16h12v4h-8v8h-4z" $focused />
                      <CropEdgeHandle x={114} y={14} width={12} height={4} />
                      <CropHandleInteractionArea x={20} y={12} width={200} height={8} />
                      <HotspotEllipse cx={120} cy={80} rx={48} ry={32} $hovered />
                      <HotspotHandle cx={168} cy={80} r={4} />
                      <HotspotHandleInteractionArea cx={168} cy={80} r={10} />
                      <CropDimensionsBadgeGroup $visible>
                        <CropDimensionsBadgeRect x={160} y={124} width={56} height={18} />
                        <CropDimensionsBadgeText x={188} y={137} textAnchor="middle">
                          192×128
                        </CropDimensionsBadgeText>
                      </CropDimensionsBadgeGroup>
                    </StyledSVG>
                  </SVGContainer>
                </HotspotImageContainer>
              </Section>

              <Section title="unknown value">
                <UiText>
                  <UnknownValue labels={['annotation legacyLink', 'mark strike']}>
                    Span with unknown marks
                  </UnknownValue>
                </UiText>
                <UnknownValue block labels={['block legacyCallout']}>
                  <UiText>Block of an unknown type</UiText>
                </UnknownValue>
              </Section>

              <Section title="field group tabs">
                <FieldGroupTabs
                  groups={FIELD_GROUPS}
                  inputId="field-groups"
                  onClick={noop}
                  path={['content']}
                  shouldAutoFocus={false}
                />
              </Section>

              <Section title="reference link card">
                <ReferenceLinkCard
                  as={FixtureLink}
                  documentId="author-1"
                  documentType="author"
                  parentRefPath={REF_PATH}
                  padding={2}
                  radius={2}
                  border
                >
                  <UiText>Linked reference preview</UiText>
                </ReferenceLinkCard>
                <ReferenceLinkCard
                  as={FixtureLink}
                  documentId="author-2"
                  documentType={undefined}
                  parentRefPath={REF_PATH}
                  padding={2}
                  radius={2}
                  border
                >
                  <UiText muted>Reference without a resolved type</UiText>
                </ReferenceLinkCard>
              </Section>

              <Section title="incompatible array item type">
                <Card border radius={2}>
                  <Flex>
                    <IncompatibleItemType value={INCOMPATIBLE_VALUE} />
                  </Flex>
                </Card>
              </Section>
            </VStack>
          </Card>
        </ChangeIndicatorsTracker>
      </LocaleProvider>
    </TestWrapper>
  )
}
