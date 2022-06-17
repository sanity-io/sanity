import React, {useMemo} from 'react'
import {Box, Flex, Grid, Label, Heading, Card, Text, Stack} from '@sanity/ui'
import PropTypes from 'prop-types'
import {BlockText} from './BlockText'
import {useIdPair, useListeningQuery} from '../../plugins/listening-query/listening-query-hook'

import {Picture} from './PetPreviewComponents'
import {Layout} from './components/layout'
import {GridList} from './components'
/**
 * Renders thecurrently displayed document as formatted JSON as a
 * simple little "webpage" using:
 * - @sanity/ui
 * - @sanity/image-url
 */
export function HumanPreview(props) {
  const document = props.document.displayed
  if (!document) {
    return null
  }
  return <HumanPreviewInner document={document} />
}

// Resolve the pets references so we can list them in the preview
const blockJoins = `
 {
  ...,
  "pets": pets[]-> 
    {
      name, 
      picture { 
        asset->
      }
    }
  }
`

function queryFor({draftId, publishedId}) {
  return draftId || publishedId
    ? `{
    ${draftId ? `"draft":  * [_id == $draftId][0]${blockJoins},` : ''}
    ${publishedId ? `"published":  * [_id == $id][0]${blockJoins},` : ''}
  }`
    : undefined
}

function useListenForRef(id) {
  const ids = useIdPair(id)
  const query = queryFor(ids)
  const {data} = useListeningQuery(query, ids)

  const {draft, published} = data ?? {}
  return draft ?? published
}

export function HumanPreviewInner({document}) {
  const {_id} = document
  const resolvedDocument = useListenForRef(_id)
  const petsListItems = useMemo(
    () =>
      resolvedDocument?.pets?.filter(Boolean).map((pet) => ({
        _id: pet._id,
        title: pet.name,
        image: pet?.picture,
      })),
    [resolvedDocument?.pets]
  )

  if (!resolvedDocument) {
    return null
  }

  const {picture, name, bio} = resolvedDocument

  return (
    <Layout>
      <Stack space={5}>
        <Box paddingX={4}>
          <Picture picture={picture} size={400} />
          {picture?.caption && (
            <Box marginLeft={5} marginY={3}>
              <Label as="p">{picture?.caption}</Label>
            </Box>
          )}
        </Box>
        <Box paddingX={4}>
          <Heading as="h1" size={4}>
            {name ?? 'Gimme a name!'}
          </Heading>
        </Box>
        {bio?.length && (
          <Box paddingX={4}>
            <BlockText value={bio} />
          </Box>
        )}
        {petsListItems?.length > 0 && <GridList heading="Pets" items={petsListItems} />}
        {/*
        <Box paddingX={4}>
            <Heading size={3}>Pets</Heading>

            <Grid columns={2} gap={4}>
              {pets?.filter(Boolean).map((pet) => (
                <Box key={pet}>
                  <Stack space={3}>
                    <Picture
                      size={400}
                      borderPercentage={50}
                      picture={pet?.picture}
                    />
                    <Text size={1}>{pet.name}</Text>
                  </Stack>
                </Box>
              ))}
            </Grid>
          </Box>
        */}
      </Stack>
    </Layout>
  )
}

HumanPreview.propTypes = {
  document: PropTypes.shape({
    displayed: PropTypes.object,
    draft: PropTypes.object,
    published: PropTypes.object,
  }),
}

HumanPreview.propTypes = {
  document: PropTypes.object,
}
