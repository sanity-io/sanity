'use strict'

class Query {
  constructor() {
    this._from = 0
    this._to = 50
    this._constraints = []
    this._orderBy = []
    this._params = {}
  }

  to(toIndex) {
    if (typeof toIndex === 'undefined') {
      return this._to
    }

    var size = toIndex - this._from

    if (typeof toIndex !== 'number' || size > 1000) {
      throw new Error('`to` must be a number, query size cannot exceed 1000 items')
    }

    this._to = toIndex
    return this
  }

  from(fromIndex) {
    if (typeof fromIndex === 'undefined') {
      return this._from
    }

    if (typeof fromIndex !== 'number' || fromIndex < 0) {
      throw new Error('`from` must be a positive number')
    }

    this._from = fromIndex
    return this
  }

  constraint(constraint) {
    if (Array.isArray(constraint)) {
      this._constraints = this._constraints.concat(constraint)
      return this
    }

    if (!constraint) {
      return this._constraints
    }

    this._constraints.push(constraint)

    return this
  }

  order() {
    return this.orderBy(...arguments)
  }

  orderBy(field) {
    var dir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'desc'

    if (typeof field === 'undefined') {
      return this._orderBy
    }

    if (Array.isArray(field)) {
      this._orderBy = field
      return this
    }

    var fieldType = typeof field

    if (fieldType !== 'string') {
      throw new Error(
        'orderBy() takes a field name as first argument, '.concat(fieldType, ' given')
      )
    }

    var order = String(dir).toLowerCase()

    if (order !== 'desc' && order !== 'asc') {
      throw new Error('Direction must be `asc` or `desc`')
    }

    this._orderBy = [[field, order]]
    return this
  }

  params(params) {
    if (!params) {
      return this._params
    }

    this._params = Object.assign({}, this._params, params)
    return this
  }

  clone() {
    return new Query()
      .to(this._to)
      .from(this._from)
      .constraint(this._constraints)
      .orderBy(this._orderBy)
      .params(this._params)
  }

  toJSON() {
    return {
      to: this._to,
      from: this._from,
      constraints: this._constraints,
      orderBy: this._orderBy,
      params: this._params,
    }
  }

  toString() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {}
    var constraints = this._constraints
    var enclose = constraints.length > 1 ? (group) => '('.concat(group, ')') : (inp) => inp
    var constraint = constraints.map(enclose).join(' && ')
    var baseQuery = '*['.concat(constraint, ']')

    if (options.constraintsOnly) {
      return baseQuery
    }

    var order = this._orderBy.map((pair) => pair.join(' ')).join(', ')

    var range = ''.concat(this._from, '...').concat(this._to)
    var query = ''.concat(baseQuery, ' | order(').concat(order, ') [').concat(range, ']')
    return query
  }
}

module.exports = Query
