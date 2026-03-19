import {diffInput, wrap} from '@sanity/diff'
import {ArrowLeftIcon, ArrowRightIcon, CloseIcon} from '@sanity/icons'
import {Box, Card, Flex, Skeleton, Spinner, Text, useLayer} from '@sanity/ui'
import {fromString} from '@sanity/util/paths'
import {type RefObject, type ComponentType, Fragment} from 'react'
import {DocumentChangeContext} from 'sanity/_singletons'

import {Button} from '../../../ui-components/button/Button'
import {emptyValuesByType} from '../../field/diff/helpers'
import type {DiffComponent, DiffComponentOptions} from '../../field/types'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type DivergenceNavigator, type ReachableDivergence} from '../divergenceNavigator'
import {useDivergenceController} from '../hooks/useDivergenceController'
import {useVersionRelease} from '../hooks/useVersionRelease'
import {DivergenceOverlay} from './DivergenceOverlay'

/**
 * @internal
 */
export interface DivergenceDetailProps {
  divergence: ReachableDivergence
  divergenceNavigator: DivergenceNavigator
  title?: string
  containerElement?: RefObject<HTMLDivElement | null>
  readOnly: boolean | undefined
}

const sectionPadding = 4

/**
 * @internal
 */
export const DivergenceDetail: ComponentType<DivergenceDetailProps> = ({
  divergenceNavigator,
  divergence,
  containerElement,
  readOnly: contextReadOnly,
}) => {
  const {
    upstreamBase,
    upstreamHead,
    markResolved,
    takeUpstreamValue,
    isReadOnly,
    isActionPending,
    isLoading,
  } = useDivergenceController(
    divergence,
    divergenceNavigator.state.allDivergences,
    contextReadOnly ?? false,
  )

  const {release: upstreamRelease, state: upstreamReleaseState} = useVersionRelease(
    divergence.documentId,
  )

  const diff = isLoading
    ? undefined
    : diffInput<any>(
        wrap(upstreamBase?.value?.value ?? emptyValuesByType[divergence.schemaType.jsonType], {}),
        wrap(upstreamHead?.value?.value ?? emptyValuesByType[divergence.schemaType.jsonType], {}),
        {},
      )

  const DiffComponent = normalizeDiffComponent(divergence.diffComponent)

  const divergenceIndex = divergenceNavigator.state.divergences.findIndex(
    ([path]) => path === divergence.path,
  )

  const {t} = useTranslation()
  const layer = useLayer()

  return (
    <DocumentChangeContext.Provider
      value={{
        documentId: divergence.documentId,
        schemaType: divergence.schemaType,
        isComparingCurrent: false,
        FieldWrapper: Fragment,
        rootDiff: null,
        value: upstreamHead?.value?.document ?? {},
        showFromValue: true,
      }}
    >
      <div ref={containerElement}>
        <DivergenceOverlay
          open
          border
          radius={3}
          shadow={2}
          $path={fromString(divergence.path)}
          contentEditable={false}
          $layer={layer}
        >
          <Flex justify="space-between" align="center">
            <Box paddingX={sectionPadding} paddingY={sectionPadding}>
              <Text size={1}>
                {upstreamReleaseState === 'loaded' &&
                  t('divergence.effect.summary', {
                    title: divergence.schemaType.title,
                    effect: t('divergence.effect.changed'),
                    versionName:
                      typeof upstreamRelease === 'string'
                        ? upstreamRelease
                        : upstreamRelease?.metadata.title,
                  })}
              </Text>
            </Box>
            <Box paddingLeft={sectionPadding} paddingRight={3}>
              <Button
                aria-label={t('divergence.action.close.label')}
                icon={CloseIcon}
                mode="bleed"
                onClick={divergenceNavigator.blurFocusedDivergence}
                tooltipProps={{
                  content: t('divergence.action.close.label'),
                  portal: true,
                }}
              />
            </Box>
          </Flex>
          <Card padding={sectionPadding} borderTop borderBottom>
            {isLoading ? (
              <Skeleton
                animated
                delay={1000}
                radius={1}
                style={{width: '100%', aspectRatio: '1/0.125'}}
              />
            ) : (
              <>
                {diff && DiffComponent && (
                  // eslint-disable-next-line react-hooks/static-components
                  <DiffComponent diff={diff} schemaType={divergence.schemaType} />
                )}
              </>
            )}
          </Card>
          <Box paddingX={sectionPadding} paddingY={sectionPadding - 1}>
            <Flex flex={1} gap={2} justify="space-between">
              <Flex flex={1} gap={3} align="center">
                <Flex gap={2} align="center">
                  <Button
                    mode="ghost"
                    tone="neutral"
                    text={t('divergence.action.markResolved.label')}
                    type="button"
                    onClick={markResolved}
                    disabled={isReadOnly}
                  />
                  <Button
                    mode="ghost"
                    tone="neutral"
                    text={t('divergence.action.takeFromUpstream.label')}
                    type="button"
                    onClick={takeUpstreamValue}
                    disabled={isReadOnly}
                  />
                </Flex>
                {isActionPending && <Spinner />}
              </Flex>
              <Flex flex={1} gap={2} style={{justifyContent: 'flex-end'}} align="center">
                <Text size={1}>
                  {t('divergence.pagination', {
                    position: divergenceIndex + 1,
                    count: divergenceNavigator.state.divergences.length,
                  })}
                </Text>
                <Button
                  aria-label={t('divergence.action.previous.label')}
                  tooltipProps={{
                    content: t('divergence.action.previous.label'),
                  }}
                  mode="ghost"
                  tone="neutral"
                  icon={ArrowLeftIcon}
                  type="button"
                  disabled={divergenceNavigator.state.divergences.length < 2}
                  onClick={() => {
                    if (typeof divergenceNavigator.state.previousDivergence !== 'undefined') {
                      divergenceNavigator.focusDivergence(
                        divergenceNavigator.state.previousDivergence,
                      )
                    }
                  }}
                />
                <Button
                  aria-label={t('divergence.action.next.label')}
                  tooltipProps={{
                    content: t('divergence.action.next.label'),
                  }}
                  mode="ghost"
                  tone="neutral"
                  icon={ArrowRightIcon}
                  type="button"
                  disabled={divergenceNavigator.state.divergences.length < 2}
                  onClick={() => {
                    if (typeof divergenceNavigator.state.nextDivergence !== 'undefined') {
                      divergenceNavigator.focusDivergence(divergenceNavigator.state.nextDivergence)
                    }
                  }}
                />
              </Flex>
            </Flex>
          </Box>
        </DivergenceOverlay>
      </div>
    </DocumentChangeContext.Provider>
  )
}

function normalizeDiffComponent(
  diffComponent: DiffComponent | DiffComponentOptions | undefined,
): DiffComponent | undefined {
  if (typeof diffComponent === 'undefined') {
    return undefined
  }

  if ('component' in diffComponent) {
    return diffComponent.component
  }

  return diffComponent
}
