import React, { useMemo } from "react";
import {
  Box,
  Flex,
  Label,
  Heading,
  Text,
  Card,
  Grid,
  Stack,
  Tooltip,
} from "@sanity/ui";
import PropTypes from "prop-types";
import { BlockText } from "./BlockText";
import {
  useIdPair,
  useListeningQuery,
} from "../../plugins/listening-query/listening-query-hook";
import { GridBox, Picture } from "./PetPreviewComponents";
import { Layout, Divider, GridList, MetadataList } from "./components";

export function PetPreview(props) {
  const doc = props.document.displayed;
  if (!doc) {
    return null;
  }
  return <PetPreviewInner doc={doc} />;
}

function queryFor({ draftId, publishedId }) {
  return draftId || publishedId
    ? `{
    ${draftId ? '"draft":  * [_id == $draftId][0],' : ""}
    ${publishedId ? '"published":  * [_id == $id][0],' : ""}
  }`
    : undefined;
}

function useListenForRef(id) {
  const ids = useIdPair(id);
  const query = queryFor(ids);
  const { data } = useListeningQuery(query, ids);

  const { draft, published } = data ?? {};
  return draft ?? published;
}

export function PetPreviewInner({ doc }) {
  const resolvedDocument = useListenForRef(doc._id);
  const {
    name,
    description,
    shortDescription,
    weight,
    birthday,
    fluffiness,
    toys,
    treats,
    friends,
    picture,
    human,
    hair,
  } = resolvedDocument || {};

  const metadata = useMemo(() => {
    const metadataList = [];

    if (birthday) {
      metadataList.push({
        title: 'Born 🎁"',
        value: birthday,
      });
    }

    if (hair) {
      metadataList.push({
        title: "Hairstyle 🐩",
        value: hair,
      });
    }

    metadataList.push({
      title: "Fluffiness 🐑",
      value: hair !== "hairless" ? fluffiness : "No fluff!",
    });

    metadataList.push({
      title: "Weight 💪",
      value: weight ? `${weight} kg` : "Unknown 🤔",
    });

    return metadataList
  }, [birthday, fluffiness, hair, weight]);

  const favouriteProducts = useMemo(() => {
    return []
  }, []);

  if (!resolvedDocument) {
    return null
  }

  // const humanReferenceDocument = useListenForRef(human?._ref);
  // const favoriteTreatsReferenceDocument = useListenForRef(treats?.[0]?._ref);
  // const favoriteToysReferenceDocument = useListenForRef(toys?.[0]?._ref);
  // const bffReferenceDocument = useListenForRef(friends?.[0]?._ref);


  return (
    <Layout>
      <Stack space={5} paddingX={4}>
        <Box>
          <Picture picture={picture} size={400} />
          {picture?.caption && (
            <Box marginLeft={5} marginY={3}>
              <Label as="p">{picture?.caption}</Label>
            </Box>
          )}
        </Box>

        <Box>
          <Heading as="h1" size={4}>
            {name ?? "Gimme a name!"}
          </Heading>
        </Box>

        {shortDescription?.length && <Label as="p">{shortDescription}</Label>}

        {description?.length && (
          <Box>
            <BlockText value={description} />
          </Box>
        )}

        <Divider />

        {metadata.length > 0 && <MetadataList items={metadata} />}

        {/*
      <Stack space={4}>
          <Flex>
            <Card>
              <Grid columns={3} gap={5}>
                <GridBox text={"Born 🎁"} value={birthday ?? " "} />

                <GridBox text={"Hairstyle 🐩"} value={hair} />

                <GridBox
                  text={"Fluffiness 🐑"}
                  value={hair !== "hairless" ? fluffiness : "No fluff!"}
                />

                <GridBox
                  text={"Weight 💪"}
                  value={weight ? `${weight} kg` : "Unknown 🤔"}
                />

                {bffReferenceDocument && (
                  <Box>
                    <Label>My BFF 👯‍♀️ </Label>
                    <Flex marginTop={2} direction="column">
                      <Tooltip
                        content={
                          <Box padding={2}>
                            <Text muted size={1}>
                              {bffReferenceDocument?.name}
                            </Text>
                          </Box>
                        }
                        portal
                        placement="left"
                        fallbackPlacements="left"
                      >
                        <Box marginTop={1} size={2}>
                          <Text>
                            <Picture
                              size={50}
                              borderPercentage={50}
                              picture={bffReferenceDocument?.picture}
                            />
                          </Text>
                        </Box>
                      </Tooltip>
                    </Flex>
                  </Box>
                )}

                {humanReferenceDocument && (
                  <Box>
                    <Label>Human 👁</Label>
                    <Flex marginTop={2} direction="column">
                      <Tooltip
                        content={
                          <Box padding={2}>
                            <Text muted size={1}>
                              {humanReferenceDocument?.name}
                            </Text>
                          </Box>
                        }
                        fallbackPlacements={["right", "left"]}
                        portal
                        placement="left"
                      >
                        <Box marginTop={1}>
                          <Text>
                            <Picture
                              size={50}
                              borderPercentage={50}
                              picture={humanReferenceDocument?.picture}
                            />
                          </Text>
                        </Box>
                      </Tooltip>
                    </Flex>
                  </Box>
                )}
              </Grid>
            </Card>
          </Flex>
        </Stack>
        */}

        <Divider />

        {(favouriteProducts?.length > 0) && (
          <Box>
            <GridList
              heading="Favorite toys & treats"
              items={favouriteProducts}
            />
          </Box>
        )}

        {/*
          <Box marginBottom={2}>
              <Label size={4}>Favorite products</Label>
            </Box>
            <Flex direction="row">
              {favoriteToysReferenceDocument && (
                <Flex marginRight={2} marginTop={2} direction="column">
                  <Picture
                    picture={favoriteToysReferenceDocument?.variants[0].picture}
                    size={150}
                    borderPercentage={20}
                  />
                  <Box marginTop={2} marginLeft={2}>
                    <Text>{favoriteToysReferenceDocument?.name}</Text>
                  </Box>
                </Flex>
              )}

              {favoriteTreatsReferenceDocument && (
                <Flex marginTop={2} direction="column">
                  <Picture
                    picture={
                      favoriteTreatsReferenceDocument?.variants[0].picture
                    }
                    size={150}
                    borderPercentage={20}
                  />
                  <Box marginTop={2} marginLeft={2}>
                    <Text>{favoriteTreatsReferenceDocument?.name}</Text>
                  </Box>
                </Flex>
              )}
            </Flex>
        */}
      </Stack>
    </Layout>
  );
}

PetPreview.propTypes = {
  document: PropTypes.shape({
    displayed: PropTypes.object,
    draft: PropTypes.object,
    published: PropTypes.object,
  }),
};

PetPreviewInner.propTypes = {
  doc: PropTypes.object,
};
