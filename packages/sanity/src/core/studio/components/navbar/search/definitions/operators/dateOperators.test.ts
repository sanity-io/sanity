/* eslint-disable max-nested-callbacks */
import {endOfDay, endOfMinute, startOfDay, startOfMinute, sub} from 'date-fns'
import {
  dateOperators,
  OperatorDateDirectionValue,
  OperatorDateEqualValue,
  OperatorDateLastValue,
  OperatorDateRangeValue,
} from './dateOperators'

interface OperatorDateEqualValueWithDate extends OperatorDateEqualValue {
  date: string
}

const fieldPath = 'dateField'

describe('dateOperators', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-01-01T00:00:00.000Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  describe('(date)', () => {
    it('should create a valid filter for dateAfter', () => {
      const value: OperatorDateDirectionValue = {date: '2000-01-20'}
      const filter = dateOperators.dateAfter.groqFilter({fieldPath, value})
      expect(filter).toEqual(`${fieldPath} > "${value.date}"`)
    })

    it('should create a valid filter for dateBefore', () => {
      const value: OperatorDateDirectionValue = {date: '2000-01-20'}
      const filter = dateOperators.dateBefore.groqFilter({fieldPath, value})
      expect(filter).toEqual(`${fieldPath} < "${value.date}"`)
    })

    it('should create a valid filter for dateEqual', () => {
      const value: OperatorDateEqualValue = {date: '2000-01-20'}
      const filter = dateOperators.dateEqual.groqFilter({fieldPath, value})
      expect(filter).toEqual(`${fieldPath} == "${value.date}"`)
    })

    describe('dateLast', () => {
      it('should create a valid filter for dateLast (days)', () => {
        const value: OperatorDateLastValue = {unit: 'days', unitValue: 7}
        const filter = dateOperators.dateLast.groqFilter({fieldPath, value})
        const timestampAgo = sub(new Date(), {days: 7}).toISOString().split('T')[0]
        expect(filter).toEqual(`${fieldPath} > "${timestampAgo}"`)
      })

      it('should create a valid filter for dateLast (months)', () => {
        const value: OperatorDateLastValue = {unit: 'months', unitValue: 7}
        const filter = dateOperators.dateLast.groqFilter({fieldPath, value})
        const timestampAgo = sub(new Date(), {months: 7}).toISOString().split('T')[0]
        expect(filter).toEqual(`${fieldPath} > "${timestampAgo}"`)
      })

      it('should create a valid filter for dateLast (years)', () => {
        const value: OperatorDateLastValue = {unit: 'years', unitValue: 7}
        const filter = dateOperators.dateLast.groqFilter({fieldPath, value})
        const timestampAgo = sub(new Date(), {years: 7}).toISOString().split('T')[0]
        expect(filter).toEqual(`${fieldPath} > "${timestampAgo}"`)
      })
    })

    it('should create a valid filter for dateNotEqual', () => {
      const value: OperatorDateEqualValue = {date: '2000-01-20'}
      const filter = dateOperators.dateNotEqual.groqFilter({fieldPath, value})
      expect(filter).toEqual(`${fieldPath} != "${value.date}"`)
    })

    it('should create a valid filter for dateRange', () => {
      const value: OperatorDateRangeValue = {
        dateMax: '2001-01-20',
        dateMin: '2000-01-20',
      }
      const filter = dateOperators.dateRange.groqFilter({fieldPath, value})
      expect(filter).toEqual(
        `${fieldPath} >= "${value.dateMin}" && ${fieldPath} <= "${value.dateMax}"`,
      )
    })
  })

  describe('(datetime)', () => {
    it('should create a valid filter for dateTimeAfter', () => {
      const value: OperatorDateDirectionValue = {date: new Date().toISOString()}
      const filter = dateOperators.dateTimeAfter.groqFilter({fieldPath, value})
      expect(filter).toEqual(`dateTime(${fieldPath}) > dateTime("${value.date}")`)
    })

    it('should create a valid filter for dateTimeBefore', () => {
      const value: OperatorDateDirectionValue = {date: new Date().toISOString()}
      const filter = dateOperators.dateTimeBefore.groqFilter({fieldPath, value})
      expect(filter).toEqual(`dateTime(${fieldPath}) < dateTime("${value.date}")`)
    })

    it('should create a valid filter for dateTimeEqual (with time)', () => {
      const value: OperatorDateEqualValueWithDate = {
        includeTime: true,
        date: new Date().toISOString(),
      }
      const date = new Date(value.date)
      const dateStart = startOfMinute(date).toISOString()
      const dateEnd = endOfMinute(date).toISOString()
      const filter = dateOperators.dateTimeEqual.groqFilter({fieldPath, value})
      expect(filter).toEqual(
        `dateTime(${fieldPath}) > dateTime("${dateStart}") && dateTime(${fieldPath}) < dateTime("${dateEnd}")`,
      )
    })

    it('should create a valid filter for dateTimeEqual (without time)', () => {
      const value: OperatorDateEqualValueWithDate = {
        includeTime: false,
        date: new Date().toISOString(),
      }
      const date = new Date(value.date)
      const dateStart = startOfDay(date).toISOString()
      const dateEnd = endOfDay(date).toISOString()
      const filter = dateOperators.dateTimeEqual.groqFilter({fieldPath, value})
      expect(filter).toEqual(
        `dateTime(${fieldPath}) > dateTime("${dateStart}") && dateTime(${fieldPath}) < dateTime("${dateEnd}")`,
      )
    })

    describe('dateTimeLast', () => {
      it('should create a valid filter for dateTimeLast (days)', () => {
        const value: OperatorDateLastValue = {unit: 'days', unitValue: 7}
        const filter = dateOperators.dateTimeLast.groqFilter({fieldPath, value})
        const timestampAgo = sub(new Date(), {days: 7}).toISOString()
        expect(filter).toEqual(`dateTime(${fieldPath}) > dateTime("${timestampAgo}")`)
      })

      it('should create a valid filter for dateTimeLast (months)', () => {
        const value: OperatorDateLastValue = {unit: 'months', unitValue: 7}
        const filter = dateOperators.dateTimeLast.groqFilter({fieldPath, value})
        const timestampAgo = sub(new Date(), {months: 7}).toISOString()
        expect(filter).toEqual(`dateTime(${fieldPath}) > dateTime("${timestampAgo}")`)
      })

      it('should create a valid filter for dateTimeLast (years)', () => {
        const value: OperatorDateLastValue = {unit: 'years', unitValue: 7}
        const filter = dateOperators.dateTimeLast.groqFilter({fieldPath, value})
        const timestampAgo = sub(new Date(), {years: 7}).toISOString()
        expect(filter).toEqual(`dateTime(${fieldPath}) > dateTime("${timestampAgo}")`)
      })
    })

    it('should create a valid filter for dateTimeNotEqual (with time)', () => {
      const value: OperatorDateEqualValueWithDate = {
        includeTime: true,
        date: new Date().toISOString(),
      }
      const date = new Date(value.date)
      const dateStart = startOfMinute(date).toISOString()
      const dateEnd = endOfMinute(date).toISOString()
      const filter = dateOperators.dateTimeNotEqual.groqFilter({fieldPath, value})
      expect(filter).toEqual(
        `dateTime(${fieldPath}) < dateTime("${dateStart}") || dateTime(${fieldPath}) > dateTime("${dateEnd}")`,
      )
    })

    it('should create a valid filter for dateTimeNotEqual (without time)', () => {
      const value: OperatorDateEqualValueWithDate = {
        includeTime: false,
        date: new Date().toISOString(),
      }
      const date = new Date(value.date)
      const dateStart = startOfDay(date).toISOString()
      const dateEnd = endOfDay(date).toISOString()
      const filter = dateOperators.dateTimeNotEqual.groqFilter({fieldPath, value})
      expect(filter).toEqual(
        `dateTime(${fieldPath}) < dateTime("${dateStart}") || dateTime(${fieldPath}) > dateTime("${dateEnd}")`,
      )
    })

    it('should create a valid filter for dateTimeRange', () => {
      const value: OperatorDateRangeValue = {
        dateMax: '2001-01-20T00:00:00.000Z',
        dateMin: '2000-01-20T00:00:00.000Z',
      }
      const filter = dateOperators.dateTimeRange.groqFilter({fieldPath, value})
      expect(filter).toEqual(
        `dateTime(${fieldPath}) >= dateTime("${value.dateMin}") && dateTime(${fieldPath}) <= dateTime("${value.dateMax}")`,
      )
    })
  })
})
