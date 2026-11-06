import {ClockIcon} from '@sanity/icons/Clock'
import {type ReleasePropertyDescription, type ReleasePropertyProps} from 'sanity'

const DAY_IN_MS = 24 * 60 * 60 * 1000
const CLOSE_TO_LAUNCH_DAYS = 7

const relativeDays = new Intl.RelativeTimeFormat('en-US', {numeric: 'auto'})

export function LaunchCountdownRow({
  release,
}: ReleasePropertyProps): ReleasePropertyDescription | null {
  const {category, launchAt} = release.metadata
  if (category !== 'productLaunch' || typeof launchAt !== 'string') return null

  const launchTime = Date.parse(launchAt)
  if (Number.isNaN(launchTime)) return null

  const daysToLaunch = Math.ceil((launchTime - Date.now()) / DAY_IN_MS)
  if (daysToLaunch < 0) {
    return {label: 'Goes live', value: 'Launched', icon: ClockIcon, tone: 'positive'}
  }

  return {
    label: 'Goes live',
    value: relativeDays.format(daysToLaunch, 'day'),
    icon: ClockIcon,
    tone: daysToLaunch <= CLOSE_TO_LAUNCH_DAYS ? 'caution' : undefined,
  }
}
