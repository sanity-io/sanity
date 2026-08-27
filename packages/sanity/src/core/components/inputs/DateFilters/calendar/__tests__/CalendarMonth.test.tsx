import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getAllByDataUi} from '../../../../../../../test/setup/customQueries'
import {useCurrentLocale} from '../../../../../i18n/hooks/useLocale'
import {type CalendarDayProps} from '../CalendarDay'
import {CalendarMonth} from '../CalendarMonth'

vi.mock('../../../../../hooks/useTimeZone', () => ({
  useTimeZone: () => ({getCurrentZoneDate: () => new Date('2026-08-27T12:00:00Z')}),
}))

vi.mock('../../../../../i18n/hooks/useLocale', () => ({
  useCurrentLocale: vi.fn(),
}))

const useCurrentLocaleMock = vi.mocked(useCurrentLocale)
const theme = buildTheme()

const renderCalendarDay = ({date}: CalendarDayProps) => (
  <span data-testid="calendar-day">{date.getDay()}</span>
)

describe('CalendarMonth', () => {
  beforeEach(() => {
    useCurrentLocaleMock.mockReturnValue({
      id: 'nb-NO',
      title: 'Norsk bokmål',
      weekInfo: {firstDay: 1, weekend: [6, 7]},
    })
  })

  it('aligns weekday headers and dates with the locale week start', () => {
    const {container} = render(
      <ThemeProvider theme={theme}>
        <CalendarMonth
          date={new Date('2026-08-01T12:00:00Z')}
          onSelect={vi.fn()}
          renderCalendarDay={renderCalendarDay}
          timeZoneScope={{type: 'contentReleases'}}
        />
      </ThemeProvider>,
    )

    expect(getAllByDataUi(container, 'Label').map((label) => label.textContent)).toEqual([
      'M',
      'T',
      'W',
      'T',
      'F',
      'S',
      'S',
    ])
    expect(screen.getAllByTestId('calendar-day')[0]).toHaveTextContent('1')
  })
})
