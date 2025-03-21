import {ArchiveIcon, UnarchiveIcon} from '@sanity/icons'
import {Box, Button, Dialog, Flex, Text} from '@sanity/ui'
import {useState} from 'react'
import {useTranslation} from 'sanity'
import styled from 'styled-components'

import {useQueryDocument} from '../hooks/useQueryDocument'
import {visionLocaleNamespace} from '../i18n'
import {parseParams} from './ParamsEditor'
import {type Params} from './VisionGui'

const Table = styled.table`
  width: 100%;
  border: 1px solid black;
`
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
  params: Params
  query: string
  perspective: string
}) {
  const [open, setOpen] = useState(false)
  const {saveQuery, document, deleteQuery} = useQueryDocument()
  const {t} = useTranslation(visionLocaleNamespace)

  const queries = document?.queries

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
          />
        </Box>
        <Box flex={1} marginLeft={3}>
          <Button
            text={t('action.save-query')}
            icon={ArchiveIcon}
            mode="ghost"
            width="fill"
            onClick={() =>
              saveQuery({
                params: params.raw,
                query,
                perspective,
                savedAt: new Date().toISOString(),
              })
            }
          />
        </Box>
      </Flex>
      {open && (
        <Dialog
          header={t('action.load-query')}
          id="query-save-dialog"
          onClose={() => setOpen(false)}
          zOffset={100}
          width="auto"
          height="auto"
        >
          {/*  TODO make look nice and add delete button */}
          <Box padding={4}>
            <Table>
              <thead>
                <tr style={{textAlign: 'left'}}>
                  <th style={{border: '1px solid lime'}}>
                    <Text>{t('label.saved-at')}</Text>
                  </th>
                  <th>
                    <Text>{t('action.load-query')}</Text>
                  </th>
                  <th>
                    <Text>{t('action.delete')}</Text>
                  </th>
                </tr>
              </thead>
              <tbody>
                {queries?.map((q, i) => (
                  <tr key={i}>
                    <td>
                      <Text>{q.savedAt}</Text>
                    </td>
                    <td>
                      <Button
                        key={i}
                        text={t('action.load-query')}
                        onClick={() => {
                          setQuery(q.query)
                          setPerspective(q.perspective)
                          setParams(parseParams(q.params, t))
                          editorQueryRef.current?.resetEditorContent(q.query)
                          editorParamsRef.current?.resetEditorContent(q.params)
                        }}
                      />
                    </td>
                    <td>
                      <Button
                        key={i}
                        text={t('action.delete')}
                        onClick={() => {
                          deleteQuery(q._key)
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Box>
        </Dialog>
      )}
    </>
  )
}
