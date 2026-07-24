import ChevronLeftIcon from '@sanity/icons/ChevronLeft'
import {Button, Flex, Stack, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ComponentType} from 'react'
import {type ActorRefFromLogic} from 'xstate'

import {RhombusIcon} from '../../../variants/plugin/components/PersonalizationIcons'
import {getVariantTitle} from '../../../variants/tool/util'
import {type SystemVariant} from '../../../variants/types'
import {type variantCreationMachine} from '../../machines/variantCreationMachine'
import {Body} from '../Body'
import {Header} from '../Header'
import {TextButton} from '../TextButton'

interface Props {
  variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>
}

export const SelectVariantDefinition: ComponentType<Props> = ({variantCreationRef}) => {
  const variantDefinitions = useSelector(
    variantCreationRef,
    ({context}) => context.variants?.variants ?? new Map<string, SystemVariant>(),
  )

  return (
    <>
      <Header>
        <TextButton
          title="Create variant"
          onClick={() => variantCreationRef.send({type: 'createVariant.cancel'})}
        >
          <Text size={1} weight="medium">
            <Flex gap={2} align="center">
              <ChevronLeftIcon />
              Create variant
            </Flex>
          </Text>
        </TextButton>
      </Header>
      <Body>
        <Stack gap={1}>
          {[...variantDefinitions.entries()].map(([id, variantDefinition]) => (
            <Button
              key={id}
              mode="bleed"
              justify="flex-start"
              paddingX={3}
              paddingY={3}
              icon={RhombusIcon}
              text={getVariantTitle(variantDefinition)}
              onClick={() =>
                variantCreationRef.send({
                  type: 'createVariant.selectVariant',
                  variantId: id,
                })
              }
            />
          ))}
        </Stack>
      </Body>
    </>
  )
}
