import React from 'react'
import {Card, Box, Flex, Text, Stack} from '@sanity/ui'
import styled from 'styled-components'

// eslint-disable-next-line no-useless-escape
const youtubeRegex = /youtu(?:.*\/v\/|.*v\=|\.be\/)([A-Za-z0-9_-]{11})/

const PlayIconBox = styled(Box)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  &:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2.75em;
    height: 2.75em;
    border-radius: 50%;
    background: ${({theme}) => theme.sanity.color.card.enabled.bg};
    opacity: 0.75;
  }
`

const Root = styled(Flex)`
  &:hover {
    ${PlayIconBox} {
      &:before {
        opacity: 1;
      }
    }
  }
`

const PosterCard = styled(Card)`
  width: 100%;
  padding-bottom: calc(9 / 16 * 100%);
  position: relative;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
`

const Poster = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
  display: block;
  border-radius: inherit;

  &:not([src]) {
    display: none;
  }
`
const YoutubeContainer = styled(Card)`
  position: relative;
  padding-bottom: 56.25%;
  overflow: hidden;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`
const YoutubeEmbed = ({embedId}) => (
  <YoutubeContainer radius={3}>
    <iframe
      width="853"
      height="480"
      src={`https://www.youtube.com/embed/${embedId}`}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </YoutubeContainer>
)
class Tutorial extends React.PureComponent {
  static defaultProps = {
    posterURL: null,
    showPlayIcon: false,
  }

  render() {
    const {title, posterURL, showPlayIcon, href, presenterSubtitle} = this.props

    const isYoutube = showPlayIcon && href && href.match(youtubeRegex)

    return isYoutube ? (
      <Card
        space={2}
        sizing="border"
        flex={1}
        radius={3}
        style={{position: 'relative'}}
        border
        paddingBottom={2}
      >
        <Stack space={2} height="fill">
          <YoutubeEmbed embedId={href.match(youtubeRegex)[1]} />
          <Stack space={3} flex={1} padding={2}>
            <Text as="h3" size={1} weight="bold">
              {title}
            </Text>
            {presenterSubtitle && (
              <Text size={1} muted>
                {presenterSubtitle}
              </Text>
            )}
          </Stack>
        </Stack>
      </Card>
    ) : (
      <Root flex={1}>
        <Card
          sizing="border"
          flex={1}
          radius={3}
          as="a"
          href={href}
          target="_blank"
          style={{position: 'relative'}}
          border
          paddingBottom={2}
        >
          <Stack space={2} height="fill">
            {posterURL && (
              <PosterCard radius={3}>
                <Poster src={posterURL} />
              </PosterCard>
            )}
            <Stack space={3} flex={1} padding={2}>
              <Text as="h3" size={1} weight="bold">
                {title}
              </Text>
              {presenterSubtitle && (
                <Text size={1} muted>
                  {presenterSubtitle}
                </Text>
              )}
            </Stack>
          </Stack>
        </Card>
      </Root>
    )
  }
}

export default Tutorial
