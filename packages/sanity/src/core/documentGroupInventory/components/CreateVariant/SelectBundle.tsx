import {type ReleaseDocument} from '@sanity/client/stega'
import ChevronLeftIcon from '@sanity/icons/ChevronLeft'
// oxlint-disable-next-line no-restricted-imports -- `Button` requires fine-grained control
import {Button, Label, Spinner, Stack, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ComponentType} from 'react'
import {Flex} from 'ui5'
import {type ActorRefFromLogic} from 'xstate'

import {Delay} from '../../../components/Delay'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {useSetVariant} from '../../../perspective/useSetVariant'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {getReleaseDocumentIdFromReleaseId} from '../../../releases/util/getReleaseDocumentIdFromReleaseId'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isNotArchivedRelease, isReleaseScheduledOrScheduling} from '../../../releases/util/util'
import {getVariantTitle} from '../../../variants/tool/util'
import {type selectionMachine} from '../../machines/selectionMachine'
import {type variantCreationMachine} from '../../machines/variantCreationMachine'
import {Body} from '../Body'
import {Header} from '../Header'
import {TextButton} from '../TextButton'
import {truncatedText} from './SelectBundle.css'

interface Props {
  variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>
  selectionRef: ActorRefFromLogic<typeof selectionMachine>
}

export const SelectBundle: ComponentType<Props> = ({variantCreationRef, selectionRef}) => {
  const {t} = useTranslation(studioLocaleNamespace)
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

  const headerTitle =
    typeof selectedVariantDefinition === 'undefined'
      ? t('document-group.create-variant')
      : t('document-group.create-variant.for-target', {
          variantDefinitionName: getVariantTitle(selectedVariantDefinition),
        })

  const existingBundles = existingVariants.reduce((bundleKeys, variant) => {
    const variantId = variant.document?._system.variant?._ref

    if (typeof variantId !== 'undefined' && variantId === selectedVariantDefinition?._id) {
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
          title={headerTitle}
          onClick={() =>
            variantCreationRef.send({
              type: 'createVariant.selectVariant',
              variantId: undefined,
            })
          }
        >
          <Text size={1} weight="medium">
            <Flex gap={2} alignItems="center">
              <ChevronLeftIcon />
              <span className={truncatedText}>{headerTitle}</span>
            </Flex>
          </Text>
        </TextButton>
      </Header>
      <Body>
        <Stack gap={4}>
          {!existingBundles.has('drafts') && (
            <Stack gap={3}>
              <Label as="h3">{t('document-group.create-variant.target-drafts')}</Label>
              <Stack gap={1}>
                <Button
                  mode="bleed"
                  justify="flex-start"
                  paddingX={3}
                  paddingY={3}
                  text={t('release.chip.global.drafts')}
                  // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- this string is not shown to users
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
            <Label as="h3">{t('document-group.create-variant.target-releases')}</Label>
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
              <Label as="h3">{t('document-group.create-variant.view-existing-variants')}</Label>
              <Stack gap={1}>
                {[...existingBundles.values()].map((bundleKey) => {
                  const bundle = bundles.get(getReleaseDocumentIdFromReleaseId(bundleKey))

                  const bundleTitle =
                    bundleKey === 'drafts'
                      ? t('release.chip.draft')
                      : bundleKey === 'published'
                        ? t('release.chip.published')
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
