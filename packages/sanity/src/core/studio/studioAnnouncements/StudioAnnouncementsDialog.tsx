/* eslint-disable camelcase */
import {CloseIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Flex, Grid, Text} from '@sanity/ui'
import {Fragment, useCallback, useEffect, useMemo, useRef} from 'react'
import {useTranslation} from 'react-i18next'
import {styled} from 'styled-components'

import {Button, Dialog} from '../../../ui-components'
import {useDateTimeFormat, type UseDateTimeFormatOptions} from '../../hooks'
import {SANITY_VERSION} from '../../version'
import {UpsellDescriptionSerializer} from '../upsell'
import {
  ProductAnnouncementLinkClicked,
  ProductAnnouncementViewed,
} from './__telemetry__/studioAnnouncements.telemetry'
import {Divider} from './Divider'
import {type DialogMode, type StudioAnnouncementDocument} from './types'

const DATE_FORMAT_OPTIONS: UseDateTimeFormatOptions = {
  month: 'short',
  day: '2-digit',
}

const Root = styled(Box)`
  overflow: auto;
  max-height: 75vh;
`

const DialogHeader = styled(Grid)`
  position: sticky;
  display: grid;
  grid-template-columns: 64px 1fr 64px;
  top: 0;
  z-index: 1;
  background: var(--card-bg-color);
`

const FloatingButtonBox = styled(Box)`
  position: absolute;
  top: 12px;
  right: 24px;
  z-index: 2;
`
const FloatingButton = styled(Button)``

interface AnnouncementProps {
  announcement: StudioAnnouncementDocument
  mode: DialogMode
  isFirst: boolean
  parentRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Renders the unseen document in the dialog.
 * Has a sticky header with the date and title, and a body with the content.
 */
function Announcement({announcement, mode, isFirst, parentRef}: AnnouncementProps) {
  const telemetry = useTelemetry()
  const dateFormatter = useDateTimeFormat(DATE_FORMAT_OPTIONS)
  const logViewedItemRef = useRef<HTMLDivElement | null>(null)

  const formattedDate = useMemo(() => {
    if (!announcement.publishedDate) return ''
    return dateFormatter.format(new Date(announcement.publishedDate))
  }, [announcement.publishedDate, dateFormatter])

  const handleLinkClick = useCallback(
    ({url, linkTitle}: {url: string; linkTitle: string}) => {
      telemetry.log(ProductAnnouncementLinkClicked, {
        announcement_id: announcement._id,
        announcement_title: announcement.title,
        announcement_internal_name: announcement.name,
        source: 'studio',
        studio_version: SANITY_VERSION,
        origin: mode,
        link_url: url,
        link_title: linkTitle,
      })
    },
    [telemetry, announcement, mode],
  )
  const logViewed = useCallback(
    (scrolledIntoView: boolean) => {
      telemetry.log(ProductAnnouncementViewed, {
        announcement_id: announcement._id,
        announcement_title: announcement.title,
        announcement_internal_name: announcement.name,
        source: 'studio',
        studio_version: SANITY_VERSION,
        scrolled_into_view: scrolledIntoView,
        origin: mode,
      })
    },
    [announcement._id, announcement.title, mode, telemetry, announcement.name],
  )

  useEffect(() => {
    if (isFirst) {
      // If it's the first announcement we want to log that the user has seen it.
      // The rest will be logged when they scroll into view.
      logViewed(false)
      return
    }
    const item = logViewedItemRef.current
    const parent = parentRef.current

    if (!item || !parent) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          logViewed(true)
          // Disconnect the observer after it's been viewed
          observer.disconnect()
        }
      },
      {root: parent, threshold: 1, rootMargin: '0px 0px -100px 0px'},
    )

    observer.observe(item)

    // eslint-disable-next-line consistent-return
    return () => {
      observer.disconnect()
    }
  }, [logViewed, parentRef, isFirst])

  return (
    <Box>
      <DialogHeader padding={3}>
        <Box flex={'none'} padding={2} paddingRight={0}>
          <Box paddingLeft={2}>
            <Text size={1} muted>
              {formattedDate}
            </Text>
          </Box>
        </Box>
        <Flex flex={1} padding={2} justify="center" ref={logViewedItemRef}>
          <Text as="h2" size={1} weight="semibold">
            {announcement.title}
          </Text>
        </Flex>
      </DialogHeader>
      <Box padding={4}>
        <UpsellDescriptionSerializer
          blocks={announcement.body || []}
          onLinkClick={handleLinkClick}
        />
      </Box>
    </Box>
  )
}

interface StudioAnnouncementDialogProps {
  announcements: StudioAnnouncementDocument[]
  onClose: () => void
  mode: DialogMode
}

/**
 * Renders the studio announcement dialog displaying unseen announcements.
 * @internal
 * @hidden
 */
export function StudioAnnouncementsDialog({
  announcements = [],
  onClose,
  mode,
}: StudioAnnouncementDialogProps) {
  const dialogRef = useRef(null)
  const {t} = useTranslation()

  return (
    <Dialog
      id="in-app-communication-dialog"
      onClose={onClose}
      onClickOutside={onClose}
      width={1}
      bodyHeight="fill"
      padding={false}
      __unstable_hideCloseButton
      __unstable_autoFocus={false}
    >
      <Root ref={dialogRef} height="fill">
        {announcements.map((announcement, index) => (
          <Fragment key={announcement._id}>
            <Announcement
              announcement={announcement}
              mode={mode}
              isFirst={index === 0}
              parentRef={dialogRef}
            />
            {/* Add a divider between each dialog if it's not the last one */}
            {index < announcements.length - 1 && <Divider parentRef={dialogRef} />}
          </Fragment>
        ))}
        <FloatingButtonBox>
          <FloatingButton
            aria-label={t('announcement.dialog.close-label')}
            icon={CloseIcon}
            mode="bleed"
            onClick={onClose}
            tooltipProps={{
              content: t('announcement.dialog.close'),
            }}
          />
        </FloatingButtonBox>
      </Root>
    </Dialog>
  )
}
