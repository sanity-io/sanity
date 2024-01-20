import {
  Box,
  Card,
  type CardTone,
  Flex,
  Grid,
  Stack,
  Text,
  type ThemeColor,
  type ThemeColorButton,
  type ThemeColorButtonState,
  type ThemeColorButtonStates,
  type ThemeColorButtonTones,
  type ThemeColorMuted,
  type ThemeColorMutedTone,
  ThemeColorProvider,
  type ThemeColorScheme,
  type ThemeColorSelectable,
  type ThemeColorSelectableStates,
  type ThemeColorSolid,
  type ThemeColorSolidTone,
  useRootTheme,
} from '@sanity/ui'
import {createContext, useContext, useMemo} from 'react'
import {type Tool} from 'sanity'

interface Features {
  button: boolean
  card: boolean
  input: boolean
  muted: boolean
  selectable: boolean
  solid: boolean
  spot: boolean
}

const defaultFeatures: Features = {
  button: false,
  card: false,
  input: false,
  muted: false,
  selectable: true,
  solid: false,
  spot: false,
}

const FeaturesContext = createContext<Features>(defaultFeatures)

function useFeatures() {
  return useContext(FeaturesContext)
}

export function ColorCanvas(props: {tool: Tool}) {
  const {features: featuresProp = {}} = props.tool.options
  const features = useMemo(() => ({...defaultFeatures, featuresProp}), [featuresProp])
  const {theme} = useRootTheme()

  return (
    <FeaturesContext.Provider value={features}>
      <Flex gap={1}>
        <ThemeColorProvider scheme="light">
          <ColorScheme scheme={theme.color.light} />
        </ThemeColorProvider>

        <ThemeColorProvider scheme="dark">
          <ColorScheme scheme={theme.color.dark} />
        </ThemeColorProvider>
      </Flex>
    </FeaturesContext.Provider>
  )
}

function ColorScheme(props: {scheme: ThemeColorScheme}) {
  const {scheme} = props

  return (
    <Flex direction="column" flex={1} gap={1}>
      <Color color={scheme.default} tone="default" />
      <Color color={scheme.transparent} tone="transparent" />
      <Color color={scheme.primary} tone="primary" />
      <Color color={scheme.positive} tone="positive" />
      <Color color={scheme.caution} tone="caution" />
      <Color color={scheme.critical} tone="critical" />
    </Flex>
  )
}

function Color(props: {color: ThemeColor; tone: CardTone}) {
  const {color, tone} = props
  const features = useFeatures()

  return (
    <Card padding={[3, 4, 5]} tone={tone}>
      <Stack space={[3, 4, 5]}>
        <Stack
          padding={3}
          space={2}
          style={{
            borderRadius: 3,
            boxShadow: `inset 0 0 0 1px ${color.base.border}`,
          }}
        >
          <Text>Text</Text>
          <Text muted>Muted</Text>
          <Text accent>Accent</Text>
          <Text>
            <a href="#">Link</a>
          </Text>
          <Text>
            <code>Code</code>
          </Text>
          <div
            style={{
              height: 9,
              background: `linear-gradient(to right, ${color.base.skeleton?.from}, ${color.base.skeleton?.to})`,
            }}
          />
        </Stack>

        {features.button && <ColorButton color={color.button} />}

        {features.card && (
          <Box padding={2} style={{backgroundColor: color.card.enabled.bg}}>
            <Text style={{color: 'inherit'}}>Card</Text>
          </Box>
        )}

        {features.input && (
          <Box padding={2} style={{backgroundColor: color.input.default.enabled.bg}}>
            <Text style={{color: 'inherit'}}>Input</Text>
          </Box>
        )}

        {features.muted && <ColorMuted color={color.muted} />}

        {/* @todo: remove use of `muted` here */}
        {features.selectable && <ColorSelectable color={color.selectable || color.muted} />}

        {features.solid && <ColorSolid color={color.solid} />}

        {features.spot && (
          <Flex gap={1} padding={2}>
            <Box flex={1} style={{backgroundColor: color.spot.blue, width: 25, height: 25}} />
            <Box flex={1} style={{backgroundColor: color.spot.purple, width: 25, height: 25}} />
            <Box flex={1} style={{backgroundColor: color.spot.magenta, width: 25, height: 25}} />
            <Box flex={1} style={{backgroundColor: color.spot.red, width: 25, height: 25}} />
            <Box flex={1} style={{backgroundColor: color.spot.yellow, width: 25, height: 25}} />
            <Box flex={1} style={{backgroundColor: color.spot.green, width: 25, height: 25}} />
            <Box flex={1} style={{backgroundColor: color.spot.cyan, width: 25, height: 25}} />
            <Box flex={1} style={{backgroundColor: color.spot.gray, width: 25, height: 25}} />
          </Flex>
        )}
      </Stack>
    </Card>
  )
}

function ColorButton(props: {color: ThemeColorButton}) {
  const {color} = props

  return (
    <Stack space={3}>
      <ColorButtonMode color={color.default} />
      <ColorButtonMode color={color.ghost} />
      <ColorButtonMode color={color.bleed} />
    </Stack>
  )
}

function ColorButtonMode(props: {color: ThemeColorButtonTones}) {
  const {color} = props

  return (
    <Stack space={1}>
      <Grid columns={5} marginBottom={1} gap={1}>
        <Box>
          <Text align="center" muted size={1}>
            Enabled
          </Text>
        </Box>
        <Box>
          <Text align="center" muted size={1}>
            Hovered
          </Text>
        </Box>
        <Box>
          <Text align="center" muted size={1}>
            Pressed
          </Text>
        </Box>
        <Box>
          <Text align="center" muted size={1}>
            Selected
          </Text>
        </Box>
        <Box>
          <Text align="center" muted size={1}>
            Disabled
          </Text>
        </Box>
      </Grid>
      <ColorButtonModeStates color={color.default} />
      <ColorButtonModeStates color={color.primary} />
      <ColorButtonModeStates color={color.positive} />
      <ColorButtonModeStates color={color.caution} />
      <ColorButtonModeStates color={color.critical} />
    </Stack>
  )
}

function ColorButtonModeStates(props: {color: ThemeColorButtonStates}) {
  const {color} = props

  return (
    <Grid columns={5} gap={1}>
      <ColorGenericState color={color.enabled} />
      <ColorGenericState color={color.hovered} />
      <ColorGenericState color={color.pressed} />
      <ColorGenericState color={color.selected} />
      <ColorGenericState color={color.disabled} />
    </Grid>
  )
}

function ColorGenericState(props: {color: ThemeColorButtonState}) {
  const {color} = props

  return (
    <Stack
      padding={2}
      space={2}
      style={{
        backgroundColor: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 3,
      }}
    >
      <Text align="center" style={{color: color.fg}}>
        Text
      </Text>
      <Text align="center" size={1} style={{color: color.muted.fg}}>
        Muted
      </Text>
      <Text align="center" size={1} style={{color: color.link.fg}}>
        Link
      </Text>
      <Text align="center" size={1} style={{color: color.accent.fg}}>
        Accent
      </Text>
      <Text align="center" size={1} style={{color: color.code.fg}}>
        <span style={{backgroundColor: color.code.bg}}>Code</span>
      </Text>
      <div
        style={{
          height: 9,
          background: `linear-gradient(to right, ${color.skeleton?.from}, ${color.skeleton?.to})`,
        }}
      />
    </Stack>
  )
}

function ColorMuted(props: {color: ThemeColorMuted}) {
  const {color} = props

  return (
    <Stack space={1}>
      <ColorMutedTone color={color.default} />
      <ColorMutedTone color={color.primary} />
      <ColorMutedTone color={color.positive} />
      <ColorMutedTone color={color.caution} />
      <ColorMutedTone color={color.critical} />
    </Stack>
  )
}

function ColorMutedTone(props: {color: ThemeColorMutedTone}) {
  const {color} = props

  return (
    <Grid columns={5} gap={1}>
      <ColorGenericState color={color.enabled} />
      <ColorGenericState color={color.hovered} />
      <ColorGenericState color={color.pressed} />
      <ColorGenericState color={color.selected} />
      <ColorGenericState color={color.disabled} />
    </Grid>
  )
}

function ColorSolid(props: {color: ThemeColorSolid}) {
  const {color} = props

  return (
    <Stack space={1}>
      <ColorSolidTone color={color.default} />
      <ColorSolidTone color={color.primary} />
      <ColorSolidTone color={color.positive} />
      <ColorSolidTone color={color.caution} />
      <ColorSolidTone color={color.critical} />
    </Stack>
  )
}

function ColorSolidTone(props: {color: ThemeColorSolidTone}) {
  const {color} = props

  return (
    <Grid columns={5} gap={1}>
      <ColorGenericState color={color.enabled} />
      <ColorGenericState color={color.hovered} />
      <ColorGenericState color={color.pressed} />
      <ColorGenericState color={color.selected} />
      <ColorGenericState color={color.disabled} />
    </Grid>
  )
}

function ColorSelectable(props: {color: ThemeColorSelectable}) {
  const {color} = props

  return (
    <Stack space={1}>
      <ColorSelectableTone color={color.default} />
      <ColorSelectableTone color={color.primary} />
      <ColorSelectableTone color={color.positive} />
      <ColorSelectableTone color={color.caution} />
      <ColorSelectableTone color={color.critical} />
    </Stack>
  )
}

function ColorSelectableTone(props: {color: ThemeColorSelectableStates}) {
  const {color} = props

  return (
    <Grid columns={5} gap={1}>
      <ColorGenericState color={color.enabled} />
      <ColorGenericState color={color.hovered} />
      <ColorGenericState color={color.pressed} />
      <ColorGenericState color={color.selected} />
      <ColorGenericState color={color.disabled} />
    </Grid>
  )
}
