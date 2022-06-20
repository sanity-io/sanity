import React, {useMemo} from 'react'
import {Box, Label, Heading, Text, Stack} from '@sanity/ui'
import PropTypes from 'prop-types'
import {BlockText} from './BlockText'
import {useListenForRef} from '../../plugins/listening-query/listening-query-hook'
import {Layout, Divider, GridList, MetadataList, Picture} from './components'

/* This will fetch the content, and will include the draft if it exists
The content, in this case will be split into different properties from the pet schema:
toys (Product array), friends (Pet array), and human (Human) 
  Documentation: https://www.sanity.io/docs/data-listening-query */
const query = `
  * [_id == "drafts." + $id || _id == $id]{
    ...,
    "toys": toys[] {
      ...(* [_type == "product" && _id == "drafts." + ^._ref || _id == ^._ref]| order(_updatedAt desc) [0])
    },
    "friends": friends[] {
      ...(* [_type == "pet" && _id == "drafts." + ^._ref || _id == ^._ref]| order(_updatedAt desc) [0])
    },
    "human": human {
      ...(* [_type == "human" && _id == "drafts." + ^._ref || _id == ^._ref]| order(_updatedAt desc) [0])
    },
  } | order(_updatedAt desc) [0]
`

/**
 * Renders the currently displayed document as a
 * simple little "webpage" using:
 * - @sanity/ui
 * - @sanity/image-url
 */
export function PetPreview(props) {
  const document = props.document.displayed
  if (!document) {
    return null
  }
  return <PetPreviewInner document={document} />
}

export function PetPreviewInner({document}) {
  const resolvedDocument = useListenForRef(document?._id, query) // fetch the draft or published document with the current doc id and the query
  const {
    name,
    description,
    shortDescription,
    weight,
    birthday,
    fluffiness,
    toys,
    friends,
    picture,
    human,
    hair,
  } = resolvedDocument || {}

  // holds the birthday, fluffiness, hair type and weight for the current pet
  const metadata = useMemo(() => {
    const metadataList = []

    if (birthday) {
      metadataList.push({
        title: 'Born 🎁',
        value: birthday,
      })
    }

    if (hair) {
      metadataList.push({
        title: 'Hairstyle 🐩',
        value: hair,
      })
    }

    if (fluffiness || hair === 'hairless') {
      metadataList.push({
        title: 'Fluffiness 🐑',
        value: hair !== 'hairless' ? fluffiness : 'No fluff!',
      })
    }

    if (weight) {
      metadataList.push({
        title: 'Weight 💪',
        value: weight ? `${weight} kg` : 'Unknown 🤔',
      })
    }

    if (human) {
      metadataList.push({
        title: 'Human',
        image: human?.picture,
        imageCaption: human?.name,
      })
    }

    if (friends?.length > 0) {
      metadataList.push({
        title: `My ${friends.length === 1 ? `BFF` : `BFFs`} 👯‍♀️`,
        images: [
          ...friends.map(({name, picture}) => ({
            image: picture,
            imageCaption: name,
          })),
        ],
      })
    }

    return metadataList
  }, [birthday, fluffiness, hair, weight])

  const favouriteProducts = useMemo(() => {
    return toys?.map(({name, variants}) => ({
      title: name,
      image: variants?.[0]?.picture,
    }))
  }, [toys])

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

        <Box>
          <Heading as="h1" size={4}>
            {name ?? 'Gimme a name!'}
          </Heading>
        </Box>

        {shortDescription?.length && (
          <Text as="p" cite>
            {shortDescription}
          </Text>
        )}

        {description?.length && (
          <Box>
            <BlockText value={description} />
          </Box>
        )}

        <Divider />

        {metadata.length > 0 && <MetadataList items={metadata} />}

        <Divider />

        {favouriteProducts?.length > 0 && (
          <Box>
            <GridList heading="Favorite toys & treats" items={favouriteProducts} />
          </Box>
        )}
      </Stack>
    </Layout>
  )
}

PetPreview.propTypes = {
  document: PropTypes.shape({
    displayed: PropTypes.object,
    draft: PropTypes.object,
    published: PropTypes.object,
  }),
}

PetPreviewInner.propTypes = {
  document: PropTypes.object,
}
