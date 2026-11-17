import {describe, expect, it} from 'vitest'

import {readPlanInsights} from './planInsights'

// Plans the API returned for the queries in the test names
const SORT_AND_LIMIT = `Pipeline {
  OneShot: True
  r1: StreamStep {
    $0: Fetch {
      Source: DataSource
      OneShot: True
      Filter: _type == "author"
      Selection: @.name
      Sort: _createdAt desc
      Limit: 10
    }
  }
  r2: MapStep {
    Source: r1, $1: $0
  }
  Result: r2.$1
}`

const JOIN_IN_FILTER = `Pipeline {
  OneShot: True
  r1: StreamStep {
    $0: Fetch {
      Source: DataSource
      OneShot: True
      Filter: _type == "book"
      Selection: @._type, @.author, @.title
    }
  }
  r2: ResolveRefStep {
    Source: r1, $1: Deref($0.author, Selection: @.name), ResolverType: 
  }
  r3: FilterStep {
    Source: r2, Expr: and(eq($0._type, "book"), eq($1.name, "x"))
  }
  Result: r3.$0
}`

const SUBQUERY = `Pipeline {
  r4: HashBatchStep {
    Source: r3
    Cond:  references $2
    $3: Batch { 
      $0: unionFlat($2)
      Node: Fetch {
        Source: DataSource
        OneShotNoClose: True
        Filter: (_type == "book" AND  references $0)
      }
    }
  }
}`

const COUNT = `Aggregate {
  Source: DataSource, Aggregations: [Count], Filter: _type == "author"
}[0]`

describe('readPlanInsights', () => {
  it('finds a filter that runs in memory, with what it evaluates', () => {
    expect(readPlanInsights(JOIN_IN_FILTER)).toEqual([
      {
        kind: 'filter-in-memory',
        tone: 'caution',
        expression: 'and(eq($0._type, "book"), eq($1.name, "x"))',
      },
    ])
  })

  it('finds what the index does while reading, batched subqueries and counts', () => {
    expect(readPlanInsights(SORT_AND_LIMIT)).toEqual([{kind: 'index-sort-limit', tone: 'positive'}])
    expect(readPlanInsights(SUBQUERY)).toEqual([{kind: 'batched-subquery', tone: 'positive'}])
    expect(readPlanInsights(COUNT)).toEqual([{kind: 'aggregate', tone: 'positive'}])
  })

  it('finds sorting and slicing in memory', () => {
    const plan = `Pipeline {\n  r2: SortStep {\n    Source: r1\n  }\n  r3: SliceStep {\n    Source: r2\n  }\n}`
    expect(readPlanInsights(plan).map((insight) => insight.kind)).toEqual([
      'sort-in-memory',
      'slice-in-memory',
    ])
  })
})
