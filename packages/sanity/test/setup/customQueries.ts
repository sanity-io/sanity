import {buildQueries, type Matcher, type MatcherOptions, queryHelpers} from '@testing-library/react'

const queryAllByDataUi = (container: HTMLElement, id: Matcher, options?: MatcherOptions) => {
  return queryHelpers.queryAllByAttribute('data-ui', container, id, options)
}

const getMultipleError = (c: any, dataUiValue: string) =>
  `Found multiple elements with the data-ui attribute of: ${dataUiValue}`
const getMissingError = (c: any, dataUiValue: string) =>
  `Unable to find an element with the data-ui attribute of: ${dataUiValue}`

const [queryByDataUi, getAllByDataUi, getByDataUi, findAllByDataUi, findByDataUi] = buildQueries(
  queryAllByDataUi,
  getMultipleError,
  getMissingError,
)

export {findAllByDataUi, findByDataUi, getAllByDataUi, getByDataUi, queryAllByDataUi, queryByDataUi}
