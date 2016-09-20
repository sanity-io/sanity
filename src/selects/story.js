import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import DefaultSelect from 'part:@sanity/components/selects/default'
import SearchableSelect from 'part:@sanity/components/selects/searchable'

import {range} from 'lodash'
import faker from 'faker'
import Fuse from 'fuse.js'

const items = range(100).map((item, i) => {
  return {
    title: faker.name.findName()
  }
})


class SearchableTest extends React.Component {

  constructor(...args) {
    super(...args)

    this.handleSearch = this.handleSearch.bind(this)

    const fuseOptions = {
      keys: ['title']
    }

    this.searchAbleItems = range(100).map((item, i) => {
      return {
        title: faker.name.findName()
      }
    })

    this.fuse = new Fuse(this.searchAbleItems, fuseOptions)

    this.state = {
      searchResult: []
    }
  }

  handleSearch(query) {
    const result = this.fuse.search(query)
    this.setState({
      loading: true
    })

    setTimeout(() => {
      this.setState({
        searchResult: result,
        loading: false
      })
    }, 500)
  }

  render() {
    return (
      <SearchableSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onSearch={this.handleSearch}
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onOpen={action('onOpen')}
        loading={this.state.loading}
        items={this.state.searchResult}
      />

    )
  }
}


storiesOf('Selects')
  .addWithInfo(
  'Default',
  `
    Default select. Works as a normal <select />
  `,
  () => {
    return (
      <DefaultSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onBlur={action('onBlur')}
        items={items}
      />
    )
  },
  {
    propTables: [DefaultSelect],
    role: 'part:@sanity/components/selects/default'
  }
)
.addWithInfo(
  'Default other value',
  `
    Default select. Works as a normal <select />
  `,
  () => {
    return (
      <DefaultSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onBlur={action('onBlur')}
        value={items[10]}
        items={items}
      />
    )
  },
  {
    propTables: [DefaultSelect],
    role: 'part:@sanity/components/selects/default'
  }
)
.addWithInfo(
  'Searchable items',
  `
    When provided with items, the component searches inside these when no onSearch is provided
  `,
  () => {
    return (
      <SearchableSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onChange')}
        onBlur={action('onBlur')}
        onOpen={action('onOpen')}
        items={items}
      />
    )
  },
  {
    propTables: [SearchableSelect],
    role: 'part:@sanity/components/selects/searchable'
  }
)

.addWithInfo(
  'Searchable (selected value)',
  `
    When provided with items, the component searches inside these when no onSearch is provided
  `,
  () => {
    return (
      <SearchableSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onChange')}
        onBlur={action('onBlur')}
        onOpen={action('onOpen')}
        value={items[5]}
        items={items}
      />
    )
  },
  {
    propTables: [SearchableSelect],
    role: 'part:@sanity/components/selects/searchable'
  }
)
.addWithInfo(
  'Searchable function',
  `
    When an onSearch is provided. Populate the items, and remember to set loading when waiting for server.
  `,
  () => {

    return (
      <SearchableSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onSearch={action('onSearch')}
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onOpen={action('onOpen')}
        items={[]}
      />
    )
  },
  {
    propTables: [SearchableSelect],
    role: 'part:@sanity/components/selects/searchable'
  }
)

.addWithInfo(
  'Searchable (loading)',
  `
    Takes a loading prop.
  `,
  () => {

    return (
      <SearchableSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onSearch={action('onSearch')}
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onOpen={action('onOpen')}
        loading
        items={[]}
      />
    )
  },
  {
    propTables: [SearchableSelect],
    role: 'part:@sanity/components/selects/searchable'
  }
)


.addWithInfo(
  'Searchable ajax example',
  `
    When an onSearch is provided. Populate the items, and remember to set _loading prop_ when waiting for server.
  `,
  () => {

    return (
      <SearchableTest />
    )
  },
  {
    propTables: [SearchableSelect],
    role: 'part:@sanity/components/selects/searchable'
  }
)
