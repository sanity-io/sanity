import {CloseIcon} from '@sanity/icons'
import {type PortableTextBlock} from '@sanity/types'
import {Box, Flex, Grid, Text} from '@sanity/ui'
import {useMemo, useRef} from 'react'
import {styled} from 'styled-components'

import {Button, Dialog} from '../../../ui-components'
import {useDateTimeFormat, type UseDateTimeFormatOptions} from '../../hooks'
import {UpsellDescriptionSerializer} from '../upsell'
import {Divider} from './Divider'
import {type StudioAnnouncementDocument} from './types'

const DATE_FORMAT_OPTIONS: UseDateTimeFormatOptions = {
  month: 'short',
  day: '2-digit',
}

const Root = styled(Box)`
  overflow: scroll;
`

const DialogHeader = styled(Grid)`
  position: sticky;
  display: grid;
  grid-template-columns: 64px 1fr 64px;
  top: 0;
  z-index: 1;
  background: var(--card-bg-color);
`

const FloatingButton = styled(Button)`
  position: absolute;
  top: 12px;
  right: 24px;
  z-index: 2;
`

function DialogBody(props: {body: PortableTextBlock[]; header: string; publishedDate?: string}) {
  const {body = [], header, publishedDate} = props
  const dateFormatter = useDateTimeFormat(DATE_FORMAT_OPTIONS)

  const formattedDate = useMemo(() => {
    if (!publishedDate) return ''
    return dateFormatter.format(new Date(publishedDate))
  }, [publishedDate, dateFormatter])

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
        <Flex flex={1} padding={2} justify="center">
          <Text size={1} weight="semibold">
            {header}
          </Text>
        </Flex>
      </DialogHeader>
      <Box padding={4}>
        <UpsellDescriptionSerializer blocks={body} />
      </Box>
    </Box>
  )
}

/**
 * @internal
 * @hidden
 */
export function StudioAnnouncementDialog(props: {
  unseenDocuments: StudioAnnouncementDocument[]
  onClose: () => void
}) {
  const {unseenDocuments = [], onClose} = props
  const dialogRef = useRef(null)

  return (
    <Dialog
      id="in-app-communication-dialog"
      onClose={props.onClose}
      width={1}
      bodyHeight="fill"
      padding={false}
      __unstable_hideCloseButton
      __unstable_autoFocus={false}
    >
      <Root
        ref={dialogRef}
        height={'fill'}
        data-ui="box-fill-height"
        style={{
          maxHeight: 'calc(100vh - 200px)',
        }}
      >
        {unseenDocuments.map((unseenDocument, index) => (
          <>
            <DialogBody
              key={unseenDocument._id}
              body={unseenDocument.body}
              header={unseenDocument.title}
              publishedDate={unseenDocument.publishedDate}
            />
            {/* Add a divider between each dialog if it's not the last one */}
            {index < unseenDocuments.length - 1 && <Divider parentRef={dialogRef} />}
          </>
        ))}
        <FloatingButton
          aria-label="Close dialog"
          icon={CloseIcon}
          mode="bleed"
          onClick={onClose}
          tooltipProps={{
            content: 'Close',
          }}
        />
      </Root>
    </Dialog>
  )
}
