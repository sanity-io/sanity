import {type ReleaseDocument} from '@sanity/client/stega'
import ChevronLeftIcon from '@sanity/icons/ChevronLeft'
import {SpinnerIcon} from '@sanity/icons/Spinner'
import {Button, Flex, Label, Spinner, Stack, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ComponentType} from 'react'
import {styled} from 'styled-components'
import {type ActorRefFromLogic} from 'xstate'

import {Delay} from '../../../components/Delay'
import {useSetVariant} from '../../../perspective/useSetVariant'
import {
  getReleaseIdFromReleaseDocumentId,
  isNotArchivedRelease,
  isReleaseScheduledOrScheduling,
} from '../../../releases'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {getReleaseDocumentIdFromReleaseId} from '../../../releases/util/getReleaseDocumentIdFromReleaseId'
import {getVariantTitle} from '../../../variants/tool/util'
import {type selectionMachine} from '../../machines/selectionMachine'
import {variantCreationMachine} from '../../machines/variantCreationMachine'
import {Body} from '../Body'
import {Header} from '../Header'
import {TextButton} from '../TextButton'

interface Props {
  variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>
  selectionRef: ActorRefFromLogic<typeof selectionMachine>
}

export const SelectBundle: ComponentType<Props> = ({variantCreationRef, selectionRef}) => {
  const setVariant = useSetVariant()

  const selectedVariantDefinition = useSelector(variantCreationRef, ({context}) =>
    context.variants?.variants.get(context.selectedVariantId ?? ''),
  )

  const bundles = useSelector(
    variantCreationRef,
    ({context}) => context.releases?.releases ?? new Map<string, ReleaseDocument>(),
  )

  const isVariantCreationPending = useSelector(variantCreationRef, (snapshot) =>
    snapshot.matches({active: 'creating'}),
  )

  const canSelectBundle = useSelector(variantCreationRef, (snapshot) =>
    snapshot.can({type: 'createVariant.selectBundle', bundle: undefined}),
  )

  const selectedBundle = useSelector(variantCreationRef, ({context}) => context.selectedBundle)

  const existingVariants = useSelector(selectionRef, ({context}) => context.variants)

  const existingBundles = existingVariants.reduce((bundleKeys, variant) => {
    const variantKey = variant.document?._system.variant?._ref

    if (typeof variantKey !== 'undefined' && variantKey === selectedVariantDefinition?._id) {
      bundleKeys.add(
        variant.document?._system.bundleId ??
          variant.document?._system.release?._ref ??
          'published',
      )
    }

    return bundleKeys
  }, new Set<string>())

  return (
    <>
      <Header>
        <TextButton
          title={`Create variant ${typeof selectedVariantDefinition !== 'undefined' && `for ${getVariantTitle(selectedVariantDefinition)}`}`}
          onClick={() =>
            variantCreationRef.send({
              type: 'createVariant.selectVariant',
              variantId: undefined,
            })
          }
        >
          <Text size={1} weight="medium">
            <Flex gap={2} align="center">
              <ChevronLeftIcon />
              <TruncatedText>
                Create variant{' '}
                {typeof selectedVariantDefinition !== 'undefined' &&
                  `for ${getVariantTitle(selectedVariantDefinition)}`}
              </TruncatedText>
            </Flex>
          </Text>
        </TextButton>
      </Header>
      <Body>
        <Stack gap={4}>
          {!existingBundles.has('drafts') && (
            <Stack gap={3}>
              <Label as="h3">As a draft</Label>
              <Stack gap={1}>
                <Button
                  mode="bleed"
                  justify="flex-start"
                  paddingX={3}
                  paddingY={3}
                  text="Drafts"
                  icon={<ReleaseAvatarIcon release="drafts" />}
                  iconRight={
                    isVariantCreationPending &&
                    selectedBundle?.type === 'drafts' && (
                      <Delay ms={500}>
                        <Spinner />
                      </Delay>
                    )
                  }
                  disabled={!canSelectBundle}
                  // disabled={snapshot.can({type: 'createVariant.selectBundle'/* , bundle: undefined*/})}
                  onClick={() => {
                    variantCreationRef.send({
                      type: 'createVariant.selectBundle',
                      bundle: {type: 'drafts'},
                    })

                    variantCreationRef.send({
                      type: 'createVariant.confirm',
                    })
                  }}
                />
              </Stack>
            </Stack>
          )}
          <Stack gap={3}>
            <Label as="h3">Into a release</Label>
            <Stack gap={1}>
              {[...bundles.entries()]
                .filter(
                  ([, bundle]) =>
                    bundle.state !== 'published' &&
                    isNotArchivedRelease(bundle) &&
                    !isReleaseScheduledOrScheduling(bundle) &&
                    !existingBundles.has(getReleaseIdFromReleaseDocumentId(bundle._id)),
                )
                .map(([id, bundle]) => (
                  <Button
                    key={id}
                    mode="bleed"
                    justify="flex-start"
                    paddingX={3}
                    paddingY={3}
                    text={bundle.metadata.title ?? bundle._id}
                    icon={<ReleaseAvatarIcon release={bundle} />}
                    iconRight={
                      isVariantCreationPending &&
                      selectedBundle?.type === 'release' &&
                      selectedBundle.releaseId === id && (
                        <Delay ms={500}>
                          <Spinner />
                        </Delay>
                      )
                    }
                    disabled={!canSelectBundle}
                    onClick={() => {
                      variantCreationRef.send({
                        type: 'createVariant.selectBundle',
                        bundle: {type: 'release', releaseId: id},
                      })

                      variantCreationRef.send({
                        type: 'createVariant.confirm',
                      })
                    }}
                  />
                ))}
            </Stack>
          </Stack>
          {existingBundles.size !== 0 && (
            <Stack gap={3}>
              <Label as="h3">Or view existing variants</Label>
              <Stack gap={1}>
                {[...existingBundles.values()].map((bundleKey) => {
                  const bundle = bundles.get(getReleaseDocumentIdFromReleaseId(bundleKey))
                  const bundleTitle =
                    bundleKey === 'drafts'
                      ? 'Draft'
                      : bundleKey === 'published'
                        ? 'Published'
                        : (bundle?.metadata.title ?? bundle?._id)

                  return (
                    <Button
                      key={bundleKey}
                      mode="bleed"
                      justify="flex-start"
                      paddingX={3}
                      paddingY={3}
                      text={bundleTitle ?? bundleKey}
                      icon={typeof bundle !== 'undefined' && <ReleaseAvatarIcon release={bundle} />}
                      disabled={!canSelectBundle}
                      onClick={() =>
                        setVariant({
                          perspective: bundleKey,
                          variantId: selectedVariantDefinition?._id,
                        })
                      }
                    />
                  )
                })}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Body>
    </>
  )
}

const TruncatedText = styled.span`
  overflow: hidden;
  min-inline-size: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
`
