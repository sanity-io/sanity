import styled from 'styled-components'
import {Button, Text, Card, Stack} from '@sanity/ui'
import {BoltIcon} from '@sanity/icons'
import {purple, yellow} from '@sanity/color'
import {useTranslation} from 'react-i18next'

const StyledButton = styled(Button)<{smallIcon: boolean}>`
  padding: ${(props) => (props.smallIcon ? '1px' : 0)};
  position: relative;
`

const CenteredStroke = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`

const SvgFilledCircle = ({daysLeft}: {daysLeft: number}) => {
  const totalDays = 30
  const progress = totalDays - daysLeft

  const percentage = Math.round((progress / totalDays) * 100)
  const radius = 12
  const strokeDasharray = 2 * Math.PI * radius
  const strokeDashOffset = strokeDasharray * ((100 - percentage) / 100)
  const strokeWidth = 1.2
  const size = radius * 2 + strokeWidth

  return (
    <Card>
      <CenteredStroke>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{transform: 'rotate(-90deg)'}}
        >
          <circle
            r={radius}
            cx={size / 2}
            cy={size / 2}
            fill="transparent"
            strokeWidth={strokeWidth}
            stroke={percentage > 75 ? yellow['600'].hex : purple['400'].hex}
          />
          <circle
            r={radius}
            cx={size / 2}
            cy={size / 2}
            fill="transparent"
            strokeWidth={strokeWidth}
            stroke="var(--card-border-color)"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashOffset}
          />
        </svg>
      </CenteredStroke>
    </Card>
  )
}

interface FreeTrialButtonProps {
  toggleShowContent: () => void
  daysLeft: number
}

function FreeTrialButtonDesktop({toggleShowContent, daysLeft}: FreeTrialButtonProps) {
  return (
    <StyledButton
      padding={3}
      fontSize={1}
      mode="bleed"
      onClick={toggleShowContent}
      // TODO: After facelift the icons will be all size 1,
      smallIcon={!!daysLeft}
    >
      {/* TODO: After facelift the icons will be all size 1 */}
      <Text size={daysLeft ? 1 : 2}>
        <BoltIcon />
      </Text>
      {daysLeft > 0 && <SvgFilledCircle daysLeft={daysLeft} />}
    </StyledButton>
  )
}

function FreeTrialButtonMobile({toggleShowContent, daysLeft}: FreeTrialButtonProps) {
  const {t} = useTranslation()

  return (
    <Stack as="li">
      <Button
        icon={BoltIcon}
        justify="flex-start"
        mode="bleed"
        onClick={toggleShowContent}
        text={
          daysLeft
            ? t('user-menu.action.free-trial', {count: daysLeft})
            : t('user-menu.action.free-trial-finished')
        }
      />
    </Stack>
  )
}

export function FreeTrialButton(
  props: FreeTrialButtonProps & {
    type: 'desktop' | 'mobile'
  },
) {
  const {type, ...rest} = props

  if (type === 'mobile') return <FreeTrialButtonMobile {...rest} />
  // Desktop is dark, update it after facelift is merged
  return (
    <Card scheme="dark">
      <FreeTrialButtonDesktop {...rest} />
    </Card>
  )
}
