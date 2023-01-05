/* eslint-disable max-nested-callbacks */
import {sub} from 'date-fns'
import {
  dateOperators,
  OperatorDateDirectionValue,
  OperatorDateLastValue,
  OperatorDateRangeValue,
} from './dateOperators'

const fieldPath = 'dateField'

describe('dateOperators', () => {
  describe('(date)', () => {
    it('should create a valid filter for dateAfter', () => {
      const value: OperatorDateDirectionValue = {value: '2000-01-20'}
      const filter = dateOperators.dateAfter.groqFilter({fieldPath, value})
      expect(filter).toEqual(`${fieldPath} > "${value.value}"`)
    })

    it('should create a valid filter for dateBefore', () => {
      const value: OperatorDateDirectionValue = {value: '2000-01-20'}
      const filter = dateOperators.dateBefore.groqFilter({fieldPath, value})
      expect(filter).toEqual(`${fieldPath} < "${value.value}"`)
    })

    it('should create a valid filter for dateEqual', () => {
      const value = '2000-01-20'
      const filter = dateOperators.dateEqual.groqFilter({fieldPath, value})
      expect(filter).toEqual(`${fieldPath} == "${value}"`)
    })

    describe('dateLast', () => {
      it('should create a valid filter for dateLast (days)', () => {
        const value: OperatorDateLastValue = {unit: 'days', value: 7}
        const filter = dateOperators.dateLast.groqFilter({fieldPath, value})
        const timestampAgo = sub(new Date(), {days: 7}).toISOString().split('T')[0]
        expect(filter).toEqual(`${fieldPath} > "${timestampAgo}"`)
      })

      it('should create a valid filter for dateLast (months)', () => {
        const value: OperatorDateLastValue = {unit: 'months', value: 7}
        const filter = dateOperators.dateLast.groqFilter({fieldPath, value})
        const timestampAgo = sub(new Date(), {months: 7}).toISOString().split('T')[0]
        expect(filter).toEqual(`${fieldPath} > "${timestampAgo}"`)
      })

      it('should create a valid filter for dateLast (years)', () => {
        const value: OperatorDateLastValue = {unit: 'years', value: 7}
        const filter = dateOperators.dateLast.groqFilter({fieldPath, value})
        const timestampAgo = sub(new Date(), {years: 7}).toISOString().split('T')[0]
        expect(filter).toEqual(`${fieldPath} > "${timestampAgo}"`)
      })
    })

    it('should create a valid filter for dateNotEqual', () => {
      const value = '2000-01-20'
      const filter = dateOperators.dateNotEqual.groqFilter({fieldPath, value})
      expect(filter).toEqual(`${fieldPath} != "${value}"`)
    })

    it('should create a valid filter for dateRange', () => {
      const value: OperatorDateRangeValue = {
        max: '2001-01-20',
        min: '2000-01-20',
      }
      const filter = dateOperators.dateRange.groqFilter({fieldPath, value})
      expect(filter).toEqual(`${fieldPath} >= "${value.min}" && ${fieldPath} <= "${value.max}"`)
    })
  })

  describe('(datetime)', () => {
    it('should create a valid filter for dateTimeAfter', () => {
      const value: OperatorDateDirectionValue = {value: new Date().toISOString()}
      const filter = dateOperators.dateTimeAfter.groqFilter({fieldPath, value})
      expect(filter).toEqual(`dateTime(${fieldPath}) > dateTime("${value.value}")`)
    })

    it('should create a valid filter for dateTimeBefore', () => {
      const value: OperatorDateDirectionValue = {value: new Date().toISOString()}
      const filter = dateOperators.dateTimeBefore.groqFilter({fieldPath, value})
      expect(filter).toEqual(`dateTime(${fieldPath}) < dateTime("${value.value}")`)
    })

    it('should create a valid filter for dateTimeEqual', () => {
      const value = new Date().toISOString()
      const filter = dateOperators.dateTimeEqual.groqFilter({fieldPath, value})
      expect(filter).toEqual(`dateTime(${fieldPath}) == dateTime("${value}")`)
    })

    describe('dateTimeLast', () => {
      it('should create a valid filter for dateTimeLast (days)', () => {
        const value: OperatorDateLastValue = {unit: 'days', value: 7}
        const filter = dateOperators.dateTimeLast.groqFilter({fieldPath, value})
        const timestampAgo = sub(new Date(), {days: 7}).toISOString()
        expect(filter).toEqual(`dateTime(${fieldPath}) > dateTime("${timestampAgo}")`)
      })

      it('should create a valid filter for dateTimeLast (months)', () => {
        const value: OperatorDateLastValue = {unit: 'months', value: 7}
        const filter = dateOperators.dateTimeLast.groqFilter({fieldPath, value})
        const timestampAgo = sub(new Date(), {months: 7}).toISOString()
        expect(filter).toEqual(`dateTime(${fieldPath}) > dateTime("${timestampAgo}")`)
      })

      it('should create a valid filter for dateTimeLast (years)', () => {
        const value: OperatorDateLastValue = {unit: 'years', value: 7}
        const filter = dateOperators.dateTimeLast.groqFilter({fieldPath, value})
        const timestampAgo = sub(new Date(), {years: 7}).toISOString()
        expect(filter).toEqual(`dateTime(${fieldPath}) > dateTime("${timestampAgo}")`)
      })
    })

    it('should create a valid filter for dateTimeNotEqual', () => {
      const value = new Date().toISOString()
      const filter = dateOperators.dateTimeNotEqual.groqFilter({fieldPath, value})
      expect(filter).toEqual(`dateTime(${fieldPath}) != dateTime("${value}")`)
    })

    it('should create a valid filter for dateTimeRange', () => {
      const value: OperatorDateRangeValue = {
        max: '2001-01-20T00:00:00.000Z',
        min: '2000-01-20T00:00:00.000Z',
      }
      const filter = dateOperators.dateTimeRange.groqFilter({fieldPath, value})
      expect(filter).toEqual(
        `dateTime(${fieldPath}) >= dateTime("${value.min}") && dateTime(${fieldPath}) <= dateTime("${value.max}")`
      )
    })
  })
})
