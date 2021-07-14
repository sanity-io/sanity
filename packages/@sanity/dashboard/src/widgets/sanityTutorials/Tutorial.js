import React from 'react'
import PropTypes from 'prop-types'
import {Card, Box, Heading, Flex, Text, Stack} from '@sanity/ui'
import {PlayIcon} from '@sanity/icons'
import styled from 'styled-components'

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
`

const Poster = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  object-fit: cover;
  display: block;

  &:not([src]) {
    display: none;
  }
`

class Tutorial extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string.isRequired,
    posterURL: PropTypes.string,
    href: PropTypes.string.isRequired,
    showPlayIcon: PropTypes.bool,
    presenterName: PropTypes.string.isRequired,
    presenterSubtitle: PropTypes.string.isRequired,
  }
  static defaultProps = {
    posterURL: null,
    showPlayIcon: false,
  }

  render() {
    const {title, posterURL, showPlayIcon, href, presenterName, presenterSubtitle} = this.props

    return (
      <Root flex={1}>
        <Card
          sizing="border"
          flex={1}
          padding={2}
          radius={2}
          as="a"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{position: 'relative'}}
        >
          <Flex direction="column" style={{height: '100%'}}>
            {posterURL && (
              <PosterCard marginBottom={1}>
                <Poster src={posterURL} />
                {showPlayIcon && (
                  <PlayIconBox display="flex">
                    <Text align="center">
                      <PlayIcon />
                    </Text>
                  </PlayIconBox>
                )}
              </PosterCard>
            )}
            <Flex direction="column" justify="space-between" paddingY={2} flex={1}>
              <Heading as="h3" size={1}>
                {title}
              </Heading>
              <Box marginTop={4}>
                <Stack space={2} flex={1}>
                  <Text size={1}>{presenterName}</Text>
                  <Text size={0} style={{opacity: 0.7}}>
                    {presenterSubtitle}
                  </Text>
                </Stack>
              </Box>
            </Flex>
          </Flex>
        </Card>
      </Root>
    )
  }
}

export default Tutorial
