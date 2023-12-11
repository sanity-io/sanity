import styled from 'styled-components'
import {Button, Text, Card} from '@sanity/ui'
import {BoltIcon} from '@sanity/icons'
import {purple, yellow} from '@sanity/color'
import {useTranslation} from 'react-i18next'

const StyledButton = styled(Button)`
  padding: 1px;
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
  const strokeDasharray = 2 * 3.14 * 10
  const strokeDashOffset = strokeDasharray * ((100 - percentage) / 100)

  return (
    <CenteredStroke>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="23"
        height="23"
        viewBox="0 0 23 23"
        style={{transform: 'rotate(-90deg)'}}
      >
        <circle
          r="10"
          cx="11.5"
          cy="11.5"
          fill="transparent"
          stroke={percentage > 75 ? yellow['600'].hex : purple['400'].hex}
          strokeWidth="1.2px"
        />
        <circle
          stroke="#E6E8EC"
          r="10"
          cx="11.5"
          cy="11.5"
          fill="transparent"
          strokeWidth="1.2px"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashOffset}
        />
      </svg>
    </CenteredStroke>
  )
}

interface FreeTrialButtonProps {
  toggleShowContent: () => void
  daysLeft: number
}

function FreeTrialButtonDesktop({toggleShowContent, daysLeft}: FreeTrialButtonProps) {
  return (
    <StyledButton padding={3} fontSize={1} mode="bleed" onClick={toggleShowContent}>
      <Text size={1}>
        <BoltIcon />
      </Text>
      {daysLeft > 0 && <SvgFilledCircle daysLeft={daysLeft} />}
    </StyledButton>
  )
}

function FreeTrialButtonMobile({toggleShowContent, daysLeft}: FreeTrialButtonProps) {
  const {t} = useTranslation()

  return (
    <Button
      icon={BoltIcon}
      justify="flex-start"
      mode="bleed"
      onClick={toggleShowContent}
      text={t('user-menu.action.free-trial', {daysLeft})}
    />
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
