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

    const size = toIndex - this._from
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

  order(...args) {
    return this.orderBy(...args)
  }

  orderBy(field, dir = 'desc') {
    if (typeof field === 'undefined') {
      return this._orderBy
    }

    if (Array.isArray(field)) {
      this._orderBy = field
      return this
    }

    const fieldType = typeof field
    if (fieldType !== 'string') {
      throw new Error(`orderBy() takes a field name as first argument, ${fieldType} given`)
    }

    const order = String(dir).toLowerCase()
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

  toString(options = {}) {
    const constraints = this._constraints
    const enclose = constraints.length > 1 ? (group) => `(${group})` : (inp) => inp
    const constraint = constraints.map(enclose).join(' && ')
    const baseQuery = `*[${constraint}]`
    if (options.constraintsOnly) {
      return baseQuery
    }

    const order = this._orderBy.map((pair) => pair.join(' ')).join(', ')
    const range = `${this._from}...${this._to}`
    const query = `${baseQuery} | order(${order}) [${range}]`
    return query
  }
}

module.exports = Query
