import {LockIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {type CSSProperties, useCallback} from 'react'
import {
  formatRelativeLocale,
  getBundleIdFromReleaseDocumentId,
  getPublishDateFromRelease,
  getReleaseTone,
  isReleaseScheduledOrScheduling,
  LATEST,
  type ReleaseDocument,
  Translate,
  useTranslation,
  useVersionOperations,
} from 'sanity'
import {structureLocaleNamespace} from 'sanity/structure'

import {Button} from '../../../../../ui-components'
import {Banner} from './Banner'

export function AddToReleaseBanner({
  documentId,
  currentRelease,
  value,
}: {
  documentId: string
  currentRelease: ReleaseDocument
  value?: Record<string, unknown>
}): JSX.Element {
  const tone = getReleaseTone(currentRelease ?? LATEST)
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()

  const {createVersion} = useVersionOperations()

  const isScheduled =
    isReleaseScheduledOrScheduling(currentRelease) &&
    currentRelease.metadata.releaseType === 'scheduled'

  const handleAddToRelease = useCallback(async () => {
    if (currentRelease._id) {
      await createVersion(getBundleIdFromReleaseDocumentId(currentRelease._id), documentId, value)
    }
  }, [createVersion, currentRelease._id, documentId, value])

  return (
    <Banner
      tone={tone}
      paddingY={0}
      content={
        <Flex align="center" justify="space-between" gap={1} flex={1}>
          <Text size={1}>
            {isScheduled ? (
              <Flex align="center" justify="center" gap={2}>
                <LockIcon />{' '}
                <Translate
                  t={tCore}
                  i18nKey="release.banner.scheduled-for-publishing-on"
                  values={{
                    date: formatRelativeLocale(
                      getPublishDateFromRelease(currentRelease),
                      new Date(),
                    ),
                  }}
                />
              </Flex>
            ) : (
              <Translate
                i18nKey="banners.release.not-in-release"
                t={t}
                values={{
                  title:
                    currentRelease.metadata.title || tCore('release.placeholder-untitled-release'),
                }}
                components={{
                  Label: ({children}) => {
                    return (
                      <span
                        style={
                          {
                            color: `var(--card-badge-${tone ?? 'default'}-fg-color)`,
                            backgroundColor: `var(--card-badge-${tone ?? 'default'}-bg-color)`,
                            borderRadius: 3,
                            textDecoration: 'none',
                            padding: '0px 2px',
                            fontWeight: 500,
                          } as CSSProperties
                        }
                      >
                        {children}
                      </span>
                    )
                  },
                }}
              />
            )}
          </Text>

          {!isScheduled && (
            <Button
              text={t('banners.release.action.add-to-release')}
              tone={tone}
              onClick={handleAddToRelease}
            />
          )}
        </Flex>
      }
    />
  )
}
