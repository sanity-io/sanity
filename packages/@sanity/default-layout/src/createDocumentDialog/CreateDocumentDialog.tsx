import React, {memo, useMemo} from 'react'
import {Box, Dialog, Grid, Text} from '@sanity/ui'
import {LegacyLayerProvider} from '@sanity/base/components'
import {useCurrentUser} from '@sanity/base/hooks'
import {getNewDocumentOptions, TemplatePermissionsResult} from '@sanity/base/_internal'
import styled from 'styled-components'
import {keyBy} from 'lodash'
import {CreateDocumentItem} from './CreateDocumentItem'

const List = styled.ul`
  margin: 0;
  padding: 0;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
`

interface CreateDocumentDialogProps {
  onClose: () => void
  templatePermissions: TemplatePermissionsResult[]
  isTemplatePermissionsLoading: boolean
}

const newDocumentOptions = getNewDocumentOptions()

export const CreateDocumentDialog = memo(
  ({templatePermissions, isTemplatePermissionsLoading, onClose}: CreateDocumentDialogProps) => {
    const keyedPermissions = useMemo(() => keyBy(templatePermissions, 'id'), [templatePermissions])
    // note: this hook is called once in this component and passed via props for
    // performance reasons
    const {value: currentUser} = useCurrentUser()
    const content =
      newDocumentOptions.length <= 0 ? (
        <Box paddingY={5}>
          <Text weight="semibold" align="center">
            No initial value templates are configured.
          </Text>
        </Box>
      ) : (
        <Grid gap={3} as={List}>
          {newDocumentOptions.map((item) => {
            const granted = Boolean(
              !isTemplatePermissionsLoading && keyedPermissions[item.id]?.granted
            )

            return (
              <Box as="li" key={item.id}>
                <CreateDocumentItem
                  {...item}
                  granted={granted}
                  currentUser={currentUser}
                  onClick={onClose}
                />
              </Box>
            )
          })}
        </Grid>
      )

    return (
      <LegacyLayerProvider zOffset="navbarDialog">
        <Dialog
          data-testid="default-layout-global-create-dialog"
          id="create-document-dialog"
          onClickOutside={onClose}
          onClose={onClose}
          width={2}
          header="Create new document"
        >
          <Box padding={4}>{content}</Box>
        </Dialog>
      </LegacyLayerProvider>
    )
  }
)

CreateDocumentDialog.displayName = 'CreateDocumentDialog'
