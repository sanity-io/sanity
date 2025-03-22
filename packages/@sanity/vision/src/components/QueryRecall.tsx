import {ArchiveIcon, TrashIcon, UnarchiveIcon} from '@sanity/icons'
import {Box, Button, Code, Dialog, Flex, Text, useToast} from '@sanity/ui'
import {type Dispatch, type RefObject, type SetStateAction, useCallback, useState} from 'react'
import {useTranslation} from 'sanity'
import styled from 'styled-components'

import {type VisionCodeMirrorHandle} from '../codemirror/VisionCodeMirror'
import {useQueryDocument} from '../hooks/useQueryDocument'
import {visionLocaleNamespace} from '../i18n'
import {parseParams} from './ParamsEditor'
import {type Params} from './VisionGui'

const Table = styled.table`
  width: 100%;
  margin: 0 auto;
  & thead > tr {
    text-align: left;
  }
  & tbody > tr:nth-child(odd) {
    background-color: #f9f9f9;
  }
  & tbody > tr > td {
    padding: 0.5em;
    &.action-buttons {
      text-align: center;
    }
    &.query {
      padding: 1em 0.75em;
    }
  }
`
const DialogContentWrapper = styled.div`
  min-height: 66vh;
`

// TODO
// -Error handling for delete
// -Confirm dialog for delete
// -title/description for saved queries

export function QueryRecall({
  params,
  setParams,
  query,
  setQuery,
  perspective,
  setPerspective,
  editorQueryRef,
  editorParamsRef,
}: {
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  params: Params
  setParams: Dispatch<SetStateAction<Params>>
  perspective: string
  setPerspective: (newPerspective: string) => void
  editorQueryRef: RefObject<VisionCodeMirrorHandle | null>
  editorParamsRef: RefObject<VisionCodeMirrorHandle | null>
}) {
  const [open, setOpen] = useState(false)
  const toast = useToast()
  const {saveQuery, document, deleteQuery, saving, deleting, saveQueryError} = useQueryDocument()
  const {t} = useTranslation(visionLocaleNamespace)

  const queries = document?.queries

  const handleSave = useCallback(async () => {
    await saveQuery({
      params: params.raw,
      query,
      perspective,
      savedAt: new Date().toISOString(),
    })

    if (saveQueryError) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('save-query.error'),
        description: saveQueryError.message,
      })
    } else {
      toast.push({
        closable: true,
        status: 'success',
        title: t('save-query.success'),
      })
    }
  }, [params.raw, query, perspective, saveQuery, saveQueryError, t, toast])

  return (
    <>
      <Flex justify="space-evenly" marginTop={3}>
        <Box flex={1}>
          <Button
            width="fill"
            text={t('action.load-query')}
            onClick={() => setOpen(true)}
            icon={UnarchiveIcon}
            mode="ghost"
            // tone="primary"
          />
        </Box>
        <Box flex={1} marginLeft={3}>
          <Button
            text={t('action.save-query')}
            icon={ArchiveIcon}
            disabled={saving}
            mode="ghost"
            tone="positive"
            width="fill"
            onClick={handleSave}
          />
        </Box>
      </Flex>
      {open && (
        <Dialog
          header={
            <Flex paddingTop={3}>
              <Text size={3} weight="semibold">
                {t('action.load-queries')}
              </Text>
            </Flex>
          }
          id="query-save-dialog"
          onClose={() => setOpen(false)}
          zOffset={100}
          width={3}
        >
          {/*  TODO make look nice */}
          <DialogContentWrapper>
            <Box padding={4}>
              <Table>
                {/* <thead>
                  <tr>
                    <th>
                      <Text muted weight="semibold">
                        {t('query.label')}
                      </Text>
                    </th>
                    <th>
                      <Text muted weight="semibold">
                        {t('params.label')}
                      </Text>
                    </th>
                    <th>
                      <Text muted weight="semibold">
                        {t('label.saved-at')}
                      </Text>
                    </th>
                    <th>
                      <Text muted weight="semibold">
                        {t('action.load-query')}
                      </Text>
                    </th>
                    <th>
                      <Text muted weight="semibold">
                        {t('action.delete')}
                      </Text>
                    </th>
                  </tr>
                </thead> */}
                <tbody>
                  {queries?.map((q) => (
                    <tr key={q._key}>
                      {/* TODO: overflow for long queries */}
                      <td className="query">
                        <Code size={1}>{q.query}</Code>
                      </td>
                      <td className="params">
                        <Code size={1}>{q.params}</Code>
                      </td>
                      <td className="saved-at">
                        <Text>{new Date(q.savedAt).toLocaleString()}</Text>
                      </td>
                      <td className="action-buttons">
                        <Flex direction={'column'} gap={2}>
                          <Button
                            text={t('action.load-query')}
                            disabled={deleting?.includes(q._key)}
                            width="fill"
                            onClick={() => {
                              setQuery(q.query)
                              setPerspective(q.perspective)
                              setParams(parseParams(q.params, t))
                              editorQueryRef.current?.resetEditorContent(q.query)
                              editorParamsRef.current?.resetEditorContent(q.params)
                            }}
                          />

                          <Button
                            tone="critical"
                            width="fill"
                            disabled={deleting?.includes(q._key)}
                            icon={TrashIcon}
                            label={t('action.delete')}
                            onClick={() => {
                              deleteQuery(q._key)
                            }}
                          />
                        </Flex>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Box>
          </DialogContentWrapper>
        </Dialog>
      )}
    </>
  )
}
