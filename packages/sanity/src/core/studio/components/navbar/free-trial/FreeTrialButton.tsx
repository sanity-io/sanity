import styled from 'styled-components'

import {Card, Text} from '@sanity/ui'
import {BoltIcon} from '@sanity/icons'
import {purple, yellow} from '@sanity/color'
import {useTranslation} from 'react-i18next'
import {forwardRef} from 'react'
import {Button} from '../../../../../ui-components'

const CenteredStroke = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`

interface OutlineProps {
  daysLeft: number
  totalDays: number
}

const SvgFilledOutline = ({daysLeft, totalDays}: OutlineProps) => {
  const progress = totalDays - daysLeft

  const percentage = Math.round((progress / totalDays) * 100)
  const radius = 10
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

interface FreeTrialButtonProps extends OutlineProps {
  toggleShowContent: () => void
}

export const FreeTrialButtonTopbar = forwardRef(function FreeTrialButtonTopbar(
  {toggleShowContent, daysLeft, totalDays}: FreeTrialButtonProps,
  ref: React.Ref<HTMLButtonElement>,
) {
  const {t} = useTranslation()

  return (
    <Button
      mode="bleed"
      onClick={toggleShowContent}
      ref={ref}
      tooltipProps={{
        content: daysLeft
          ? t('free-trial.tooltip.days-count', {count: daysLeft})
          : t('free-trial.tooltip.trial-finished'),
      }}
    >
      <Text size={0}>
        <BoltIcon />
      </Text>
      {daysLeft > 0 && <SvgFilledOutline daysLeft={daysLeft} totalDays={totalDays} />}
    </Button>
  )
})

export const FreeTrialButtonSidebar = forwardRef(function FreeTrialButtonSidebar(
  {toggleShowContent, daysLeft}: Omit<FreeTrialButtonProps, 'totalDays'>,
  ref: React.Ref<HTMLButtonElement>,
) {
  const {t} = useTranslation()

  return (
    <Button
      ref={ref}
      icon={BoltIcon}
      justify="flex-start"
      mode="bleed"
      size="large"
      onClick={toggleShowContent}
      text={
        daysLeft
          ? t('user-menu.action.free-trial', {count: daysLeft})
          : t('user-menu.action.free-trial-finished')
      }
    />
  )
})
