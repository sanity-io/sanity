import {Box, Card, Container, Flex, Stack} from '@sanity/ui'
import {CloseIcon, LaunchIcon} from '@sanity/icons'
import styled from 'styled-components'
import {Button} from '../../../../../ui-components'
import {useComments} from '../../hooks'
import {DescriptionSerializer} from 'sanity'
import {useState} from 'react'
import {motion} from 'framer-motion'

const Image = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  height: 180px;
`

const StyledButton = styled(Button)`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 20;
  background: transparent;
  border-radius: 9999px;
  box-shadow: none;
  color: white;
  --card-fg-color: white;
  :hover {
    --card-fg-color: white;
  }
`

const StyledCard = styled(Card)`
  position: relative;
`

const UpsellPanel = () => {
  const {upsellData} = useComments()
  const [collapsed, setCollapsed] = useState(false)

  if (!upsellData) return null
  return (
    <Container width={1}>
      <Box paddingX={3} marginBottom={collapsed ? 3 : 6}>
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 0.3}}
          key={collapsed ? 'collapsed' : 'expanded'}
        >
          <StyledCard radius={3} marginRight={3} overflow={'hidden'} border>
            {collapsed ? (
              <Stack space={1}>
                <Flex paddingRight={2} marginTop={2} justify={'space-between'} align={'center'}>
                  <DescriptionSerializer blocks={[upsellData.descriptionText[0]]} />
                  <Button
                    text={upsellData.ctaButton.text}
                    tone="primary"
                    href={upsellData.ctaButton.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    as="a"
                  />
                </Flex>
                <Button
                  text="Learn more"
                  mode="bleed"
                  onClick={() => setCollapsed(false)}
                  width="fill"
                />
              </Stack>
            ) : (
              <>
                <StyledButton
                  icon={CloseIcon}
                  mode="bleed"
                  tone="default"
                  onClick={() => setCollapsed(true)}
                  tabIndex={-1}
                  tooltipProps={null}
                />
                {upsellData.image && (
                  <Image
                    src={upsellData.image.asset.url}
                    alt={upsellData.image.asset.altText ?? ''}
                  />
                )}
                <Box padding={3} marginTop={2}>
                  <Stack space={4}>
                    <DescriptionSerializer blocks={upsellData.descriptionText} />
                  </Stack>
                  <Flex gap={2} justify={'flex-end'} marginTop={5}>
                    <Button
                      mode="bleed"
                      text={upsellData.secondaryButton.text}
                      tone="primary"
                      iconRight={LaunchIcon}
                      href={upsellData.secondaryButton.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      as="a"
                    />
                    <Button
                      text={upsellData.ctaButton.text}
                      tone="primary"
                      href={upsellData.ctaButton.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      as="a"
                    />
                  </Flex>
                </Box>
              </>
            )}
          </StyledCard>
        </motion.div>
      </Box>
    </Container>
  )
}

export default UpsellPanel
