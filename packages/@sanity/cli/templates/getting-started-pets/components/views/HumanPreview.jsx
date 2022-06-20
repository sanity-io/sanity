import React, {useMemo} from 'react'
import {Box, Label, Heading, Stack} from '@sanity/ui'
import PropTypes from 'prop-types'
import {BlockText} from './BlockText'
import {useListenForRef} from '../../plugins/listening-query/listening-query-hook'
import {GridList, Picture, Layout} from './components'

/* This will fetch the content, and will include the draft if it exists
The content, in this case will be split into different properties from the human schema:
pets (Pet array)
  Documentation: https://www.sanity.io/docs/data-listening-query */
const query = `* [_id == "drafts." + $id || _id == $id]{
  ...,
  "pets": pets[] {
    ...(* [_type == "pet" && _id == "drafts." + ^._ref || _id == ^._ref]| order(_updatedAt desc) [0])
  },
} | order(_updatedAt desc) [0]
`

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

export function HumanPreviewInner({document}) {
  const resolvedDocument = useListenForRef(document?._id, query) // fetch the draft or published document with the current doc id and the query
  const petsListItems = useMemo(
    () =>
      resolvedDocument?.pets?.filter(Boolean).map((pet) => ({
        _id: pet._id,
        title: pet.name,
        image: pet?.picture,
      })),
    [resolvedDocument?.pets]
  )

  const {picture, name, bio} = resolvedDocument || {}

  return (
    <Layout>
      <Stack space={5} paddingX={4}>
        <Box>
          <Picture picture={picture} size={400} />
          {picture?.caption && (
            <Box marginY={3}>
              <Label as="p" align="center">
                {picture?.caption}
              </Label>
            </Box>
          )}
        </Box>

        <Heading as="h1" size={4}>
          {name ?? 'Gimme a name!'}
        </Heading>
        {bio?.length && <BlockText value={bio} />}
        {petsListItems?.length > 0 && <GridList heading="Pets" items={petsListItems} />}
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
