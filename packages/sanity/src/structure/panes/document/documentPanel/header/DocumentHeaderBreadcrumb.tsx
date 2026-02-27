import {ArrowRightIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {Fragment} from 'react'

import {LOADING_PANE} from '../../../../constants'
import {type Panes} from '../../../../structureResolvers/useResolvedPanes'
import {DocumentHeaderBreadcrumbItem} from './DocumentHeaderBreadcrumbItem'

export function DocumentHeaderBreadcrumb({
  paneDataItems,
  currentPaneIndex,
}: {
  paneDataItems: Panes['paneDataItems']
  currentPaneIndex: number
}): React.JSX.Element {
  return (
    <Flex direction="row" align="center" data-testid="document-header-breadcrumb">
      {paneDataItems.map((paneData, idx) => {
        if (idx > currentPaneIndex) return null
        const isDocumentPane = paneData.pane !== LOADING_PANE && paneData.pane.type === 'document'
        return (
          <Fragment key={`breadcrumb-item-${paneData.key}-${idx}`}>
            <DocumentHeaderBreadcrumbItem paneData={paneData} index={idx} />

            {idx < currentPaneIndex &&
              (isDocumentPane ? (
                <Box padding={1}>
                  <ArrowRightIcon />
                </Box>
              ) : (
                <Text>/</Text>
              ))}
          </Fragment>
        )
      })}
    </Flex>
  )
}
