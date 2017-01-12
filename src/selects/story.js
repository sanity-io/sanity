/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import DefaultSelect from 'part:@sanity/components/selects/default'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import CustomSelect from 'part:@sanity/components/selects/custom'
import {range} from 'lodash'
import StyleSelect from 'part:@sanity/components/selects/style'

import Fuse from 'fuse.js'

import Chance from 'chance'
const chance = new Chance()


const items = range(100).map((item, i) => {
  return {
    title: chance.name(),
    key: `${i}`
  }
})

const styleItems = [
  {
    title: 'Paragraph',
    key: 'style-paragraph'
  },
  {
    title: 'Heading 1',
    key: 'style-heading1'
  },
  {
    title: 'Heading 2',
    key: 'style-heading2'
  },
  {
    title: 'Heading 3',
    key: 'style-heading3'
  },
  {
    title: 'Heading 4',
    key: 'style-heading4'
  },
  {
    title: 'Heading 5',
    key: 'style-heading5'
  }
]

const renderStyleItem = function (item) {
  switch (item.key) {
    case 'style-paragraph':
      return (
        <div style={{fontSize: '1em', fontWeight: 'normal'}}>{item.title}</div>
      )
    case 'style-heading1':
      return (
        <div style={{fontSize: '2em', fontWeight: 'bold'}}>{item.title}</div>
      )
    case 'style-heading2':
      return (
        <div style={{fontSize: '1.5em', fontWeight: 'bold'}}>{item.title}</div>
      )
    case 'style-heading3':
      return (
        <div style={{fontSize: '1.2em', fontWeight: 'bold'}}>{item.title}</div>
      )
    default:
      return (
        <div>Style: {item.title}</div>
      )
  }

}


class SearchableTest extends React.Component {

  constructor(...args) {
    super(...args)

    const fuseOptions = {
      keys: ['title']
    }

    this.searchAbleItems = range(100).map((item, i) => {
      return {
        title: chance.name(),
        key: `${i}`
      }
    })

    this.fuse = new Fuse(this.searchAbleItems, fuseOptions)

    this.state = {
      searchResult: [],
      value: null
    }
  }

  handleFocus() {
    console.log('handleFocus') // eslint-disable-line
  }

  handleChange = value => {
    this.setState({
      value: value
    })
  }

  renderItem(item) {
    return <div>{item.title}</div>
  }

  renderValue(item) {
    if (item) {
      return item.title
    }

    return ''
  }

  handleSearch = query => {
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
        onChange={this.handleChange}
        onFocus={this.handleFocus}
        onOpen={action('onOpen')}
        loading={this.state.loading}
        items={this.state.searchResult}
        value={this.state.value}
        renderItem={this.renderItem}
        renderValue={this.renderValue}
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
  'Searchable (selected value)',
  `
    When provided with items, the component searches inside these when no onSearch is provided
  `,
  () => {
    const renderItem = function (item) {
      return (
        <div>{item.title}</div>
      )
    }
    const renderValue = function (item) {
      return item.title
    }
    return (
      <SearchableSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onBlur={action('onBlur')}
        onOpen={action('onOpen')}
        value={items[5]}
        renderValue={renderValue}
        renderItem={renderItem}
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
  'Searchable (selected value, renderItem)',
  `
    When provided with items, the component searches inside these when no onSearch is provided
  `,
  () => {
    const renderItem = function (item) {
      return (
        <div>{item.title}</div>
      )
    }
    const renderValue = function (item) {
      return item.title
    }
    return (
      <SearchableSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onBlur={action('onBlur')}
        onOpen={action('onOpen')}
        value={items[5]}
        items={items}
        renderItem={renderItem}
        renderValue={renderValue}
      />
    )
  },
  {
    propTables: [SearchableSelect],
    role: 'part:@sanity/components/selects/searchable'
  }
)

.addWithInfo(
  'Searchable (with onClear)',
  `
    When provided with items, the component searches inside these when no onSearch is provided
  `,
  () => {
    const renderItem = function (item) {
      return (
        <div>{item.title}</div>
      )
    }
    const renderValue = function (item) {
      return item.title
    }
    return (
      <SearchableSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onBlur={action('onBlur')}
        onOpen={action('onOpen')}
        onClear={action('onClear')}
        value={items[5]}
        items={items}
        renderItem={renderItem}
        renderValue={renderValue}
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
    const renderItem = function (item) {
      return (
        <div>{item.title}</div>
      )
    }
    const renderValue = function (item) {
      return item.title
    }
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
        renderItem={renderItem}
        renderValue={renderValue}
      />
    )
  },
  {
    propTables: [SearchableSelect],
    role: 'part:@sanity/components/selects/searchable'
  }
)

.addWithInfo(
  'Custom select',
  `
    Custom preview
  `,
  () => {

    const renderItem = function (item) {
      return (
        <div>Custom rendering of {item.title}</div>
      )
    }

    return (
      <CustomSelect
        label="This is the label"
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onOpen={action('onOpen')}
        renderItem={renderItem}
        value={items[2]}
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
  'Custom select (transparent)',
  `
    Custom preview
  `,
  () => {

    const renderItem = function (item) {
      return (
        <div>Custom rendering of {item.title}</div>
      )
    }

    return (
      <div style={{padding: '2em', backgroundColor: '#eee'}}>
        <CustomSelect
          label="This is the label"
          placeholder="This is the placeholder"
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onOpen={action('onOpen')}
          renderItem={renderItem}
          transparent
          value={items[2]}
          items={items}
        />
      </div>
    )
  },
  {
    propTables: [SearchableSelect],
    role: 'part:@sanity/components/selects/searchable'
  }
)


.addWithInfo(
  'Style select',
  `
    Style select
  `,
  () => {

    return (
      <div style={{padding: '2em', backgroundColor: '#eee'}}>
        <StyleSelect
          label="This is the label"
          placeholder="Select style…"
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onOpen={action('onOpen')}
          renderItem={renderStyleItem}
          transparent
          items={styleItems}
        />
      </div>
    )
  },
  {
    propTables: [StyleSelect],
    role: 'part:@sanity/components/selects/style'
  }
)


.addWithInfo(
  'Style select (one style)',
  `
    Custom preview
  `,
  () => {

    return (
      <div style={{padding: '2em', backgroundColor: '#eee'}}>
        <StyleSelect
          label="This is the label"
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onOpen={action('onOpen')}
          renderItem={renderStyleItem}
          value={[styleItems[0]]}
          transparent
          items={styleItems}
        />
      </div>
    )
  },
  {
    propTables: [StyleSelect],
    role: 'part:@sanity/components/selects/style'
  }
)

.addWithInfo(
  'Style select (multiple)',
  `
    Custom preview
  `,
  () => {

    return (
      <div style={{padding: '2em', backgroundColor: '#eee'}}>
        <StyleSelect
          label="This is the label"
          placeholder="This is the placeholder"
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onOpen={action('onOpen')}
          renderItem={renderStyleItem}
          transparent
          value={[styleItems[0], styleItems[2]]}
          items={styleItems}
        />
      </div>
    )
  },
  {
    propTables: [StyleSelect],
    role: 'part:@sanity/components/selects/style'
  }
)


.addWithInfo(
  'Searchable example',
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
