import {ClockIcon} from '@sanity/icons'
import {Badge, Box, Card, Flex, Stack, Text, useToast} from '@sanity/ui'
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
  border-collapse: collapse;

  & thead > tr {
    text-align: left;
    border-bottom: 1px solid ${({theme}) => theme.sanity.color.base.border};
  }

  & th {
    padding: 0.75em;
    position: sticky;
    top: 0;
    background: ${({theme}) => theme.sanity.color.base.bg};
    z-index: 1;
  }

  & tbody > tr {
    border-bottom: 1px solid ${({theme}) => theme.sanity.color.base.border};
    transition: background-color 0.2s ease;

    &:hover {
      background-color: ${({theme}) => theme.sanity.color.base.hover};
    }
  }

  & tbody > tr > td {
    padding: 1em 0.75em;
    vertical-align: top;

    &.action-buttons {
      width: 120px;
    }

    &.query,
    &.params {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      /* Add expand on hover */
      &:hover {
        overflow: visible;
        white-space: pre-wrap;
        word-break: break-all;
        background: ${({theme}) => theme.sanity.color.base.bg};
        position: relative;
        z-index: 1;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }

    &.saved-at {
      width: 180px;
      white-space: nowrap;
    }
  }
`

const DialogContentWrapper = styled.div`
  min-height: 66vh;
  max-height: 80vh;
  overflow: auto;

  /* Hide scrollbar for Chrome, Safari and Opera */
  ::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;
  scrollbar-width: none;
`
// ADAM design notes
// -Avoid modals, use a sidebar or a drawer
// -Title/better info for high-level view

// TODO
// -Error handling for delete
// -Confirm dialog for delete
// -title/description for saved queries
// -can/should saved queries be in a sidebar so you can tab between queries?
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
    // TS says "await has no effect on the type of this expression", but it blocks the toast until the action is complete?
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
    <Box>
      <Stack>
        <Box padding={3}>
          <Text weight="semibold" style={{textTransform: 'uppercase'}} size={1} muted>
            {t('label.all-queries')}
          </Text>
        </Box>
        <Box>
          <Stack>
            {queries?.map((q) => {
              return (
                <Card
                  key={q._key}
                  width={'fill'}
                  padding={4}
                  border
                  onClick={() => {
                    setQuery(q.query)
                    setPerspective(q.perspective)
                    setParams(parseParams(q.params, t))
                    editorQueryRef.current?.resetEditorContent(q.query)
                    editorParamsRef.current?.resetEditorContent(q.params)
                  }}
                >
                  <Stack space={3}>
                    <Flex justify="space-between">
                      {/* eslint-disable-next-line i18next/no-literal-string */}
                      <Text weight="bold">Title</Text>
                      <Badge tone="primary" padding={2} radius={1}>
                        <Text weight="medium" size={1}>
                          {t('label.personal')}
                        </Text>
                      </Badge>
                    </Flex>
                    <Text size={2} muted>
                      {q.query}
                    </Text>
                    <Flex>
                      <Text size={1} muted>
                        <ClockIcon />
                        &nbsp;
                        {new Date(q.savedAt).toLocaleString()}
                      </Text>
                    </Flex>
                  </Stack>
                </Card>
              )
            })}
          </Stack>
        </Box>
      </Stack>
    </Box>
    // <>
    //   <Flex justify="space-evenly" marginTop={3}>
    //     <Box flex={1}>
    //       <Button
    //         width="fill"
    //         text={t('action.load-query')}
    //         onClick={() => setOpen(true)}
    //         icon={UnarchiveIcon}
    //         mode="ghost"
    //         // tone="primary"
    //       />
    //     </Box>
    //     <Box flex={1} marginLeft={3}>
    //       <Button
    //         text={t('action.save-query')}
    //         icon={ArchiveIcon}
    //         disabled={saving}
    //         mode="ghost"
    //         tone="positive"
    //         width="fill"
    //         onClick={handleSave}
    //       />
    //     </Box>
    //   </Flex>
    //   {open && (
    //     <Dialog
    //       header={
    //         <Flex paddingTop={3}>
    //           <Text size={3} weight="semibold">
    //             {t('action.load-queries')}
    //           </Text>
    //         </Flex>
    //       }
    //       id="query-save-dialog"
    //       onClose={() => setOpen(false)}
    //       zOffset={100}
    //       width={2}
    //     >
    //       <DialogContentWrapper>
    //         <Box padding={4}>
    //           <Table>
    //             <thead>
    //               <tr>
    //                 <th>
    //                   <Text muted>{t('query.label')}</Text>
    //                 </th>
    //                 <th>
    //                   <Text muted>{t('params.label')}</Text>
    //                 </th>
    //                 {/* <th>
    //                   <Text muted>{t('settings.perspective-label')}</Text>
    //                 </th> */}
    //                 <th>
    //                   <Text muted>{t('label.saved-at')}</Text>
    //                 </th>
    //                 <th>
    //                   <Text muted>{t('label.actions')}</Text>
    //                 </th>
    //               </tr>
    //             </thead>
    //             <tbody>
    //               {queries?.map((q) => (
    //                 <tr key={q._key}>
    //                   <td className="query">
    //                     <Code size={1}>{q.query}</Code>
    //                   </td>
    //                   <td className="params">
    //                     <Code size={1}>{q.params}</Code>
    //                   </td>
    //                   {/* <td className="perspective">
    //                     <Text size={1}>{q.perspective}</Text>
    //                   </td> */}
    //                   <td className="saved-at">
    //                     <Text>{new Date(q.savedAt).toLocaleString()}</Text>
    //                   </td>
    //                   <td className="action-buttons">
    //                     <Flex direction={'column'} gap={2}>
    //                       <Button
    //                         text={t('action.load-query')}
    //                         disabled={deleting?.includes(q._key)}
    //                         width="fill"
    //                         mode="ghost"
    //                         icon={UnarchiveIcon}
    //                         onClick={() => {
    //                           setQuery(q.query)
    //                           setPerspective(q.perspective)
    //                           setParams(parseParams(q.params, t))
    //                           editorQueryRef.current?.resetEditorContent(q.query)
    //                           editorParamsRef.current?.resetEditorContent(q.params)
    //                         }}
    //                       />

    //                       <Button
    //                         tone="critical"
    //                         mode="ghost"
    //                         width="fill"
    //                         disabled={deleting?.includes(q._key)}
    //                         icon={TrashIcon}
    //                         text={t('action.delete')}
    //                         onClick={() => {
    //                           deleteQuery(q._key)
    //                         }}
    //                       />
    //                     </Flex>
    //                   </td>
    //                 </tr>
    //               ))}
    //             </tbody>
    //           </Table>
    //         </Box>
    //       </DialogContentWrapper>
    //     </Dialog>
    //   )}
    // </>
  )
}
