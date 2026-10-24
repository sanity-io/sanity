import {type StringDiffSegment} from '@sanity/diff'
import {DocumentIcon} from '@sanity/icons/Document'
import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {DeletedSegment, InsertedSegment} from '../../../../form/inputs/common/diff/string/segments'
import {type ProvenanceDiffAnnotation} from '../../../../form/store/types/diff'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {activeASAPRelease} from '../../../../releases/__fixtures__/release.fixture'
import {MissingSinceDocumentError} from '../../../../store/events/getDocumentChanges'
import {NoImagePreview} from '../../../types/image/diff/ImagePreview'
import {Decorator} from '../../../types/portableText/diff/components/Decorator'
import {
  InlineBox,
  PopoverContainer,
  PreviewContainer,
} from '../../../types/portableText/diff/components/styledComponents'
import {ChangeBreadcrumb} from '../ChangeBreadcrumb'
import {ChangesError} from '../ChangesError'
import {DiffErrorBoundary} from '../DiffErrorBoundary'
import {DiffBorder, FieldChangeContainer} from '../FieldChange.styled'
import {MetaInfo} from '../MetaInfo'
import {RevertChangesButton} from '../RevertChangesButton'
import {ValueError} from '../ValueError'

const DECORATORS = ['strong', 'em', 'underline', 'overline', 'strike-through', 'code'] as const

function segment(
  action: 'added' | 'removed',
  text: string,
  bundle?: ProvenanceDiffAnnotation['provenance']['bundle'],
): StringDiffSegment<ProvenanceDiffAnnotation> {
  return {type: 'stringSegment', action, text, annotation: {provenance: {bundle}}}
}

const TYPE_ERROR = {
  messageKey: 'changes.error.incorrect-type-message' as const,
  expectedType: 'string',
  actualType: 'number',
  value: 42,
}

function ThrowingDiff(): never {
  throw new Error('Diff component fixture failure')
}

// DiffErrorBoundary takes `t` as a prop (it is a class component), so the
// translation hook has to live in a wrapper.
function DiffErrorBoundaryExample() {
  const {t} = useTranslation()
  return (
    <DiffErrorBoundary t={t}>
      <ThrowingDiff />
    </DiffErrorBoundary>
  )
}

/**
 * Chromatic sentinel for review-changes chrome migrated to ui5 Box: critical
 * ValueError, caution ChangesError, MetaInfo padding, ChangeBreadcrumb title
 * segments and the DiffErrorBoundary fallback, plus the styled-components
 * pieces of a field change: the revert button, the field change container
 * with its diff border, the portable text decorators and inline/preview/
 * popover containers, the inline string diff segments and the "no image"
 * placeholder. Shared with Storybook via a thin CSF wrapper.
 */
export function FieldDiffChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              value error
            </Text>
            <ValueError error={TYPE_ERROR} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              changes error
            </Text>
            <ChangesError />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              missing revision
            </Text>
            <ChangesError error={new MissingSinceDocumentError('revAbc123')} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              meta info
            </Text>
            <MetaInfo icon={DocumentIcon} title="report.pdf">
              24 kB
            </MetaInfo>
            <MetaInfo icon={DocumentIcon} markRemoved title="old-report.pdf">
              12 kB
            </MetaInfo>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              change breadcrumb
            </Text>
            <ChangeBreadcrumb titlePath={['Article', 'Body', 'Image']} />
            <ChangeBreadcrumb
              titlePath={['Article', 'Body', 'Content', 'Block', 'Image', 'Alt text']}
            />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              diff error boundary
            </Text>
            <DiffErrorBoundaryExample />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              revert changes button: one change, three changes, selected, disabled
            </Text>
            <Flex gap={2} flexWrap="wrap">
              <RevertChangesButton changeCount={1} onClick={noop} />
              <RevertChangesButton changeCount={3} onClick={noop} />
              <RevertChangesButton changeCount={1} onClick={noop} selected />
              <RevertChangesButton changeCount={1} disabled onClick={noop} />
            </Flex>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              field change container with diff border (plain, error, revert hover)
            </Text>
            <FieldChangeContainer>
              <VStack gap={2}>
                <DiffBorder>
                  <Text size={1}>Changed field</Text>
                </DiffBorder>
                <DiffBorder data-error>
                  <Text size={1}>Field with an error</Text>
                </DiffBorder>
                <DiffBorder data-revert-field-hover>
                  <Text size={1}>Field about to be reverted</Text>
                </DiffBorder>
              </VStack>
            </FieldChangeContainer>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              portable text decorators and inline containers
            </Text>
            <Text size={1}>
              {DECORATORS.map((mark) => (
                <span key={mark}>
                  <Decorator mark={mark}>
                    <span>{mark}</span>
                  </Decorator>{' '}
                </span>
              ))}
            </Text>
            <Text size={1}>
              <PreviewContainer>
                <InlineBox data-changed>
                  <Text size={1}>changed inline object</Text>
                </InlineBox>
              </PreviewContainer>{' '}
              <InlineBox>
                <Text size={1}>plain inline object</Text>
              </InlineBox>
            </Text>
            <Card border radius={2} style={{width: 'fit-content'}}>
              <PopoverContainer padding={2}>
                <Text size={1}>popover container</Text>
              </PopoverContainer>
            </Card>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              inline string diff segments: deleted, inserted (no bundle, drafts, release)
            </Text>
            <Text size={2}>
              The <DeletedSegment segment={segment('removed', 'old')} />
              <InsertedSegment segment={segment('added', 'new')}>new</InsertedSegment> headline{' '}
              <InsertedSegment segment={segment('added', 'from a draft', 'drafts')}>
                from a draft
              </InsertedSegment>{' '}
              <InsertedSegment segment={segment('added', 'from a release', activeASAPRelease)}>
                from a release
              </InsertedSegment>
            </Text>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              image diff placeholder
            </Text>
            <Flex style={{height: 120}}>
              <NoImagePreview />
            </Flex>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
