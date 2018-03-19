/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import DefaultSelect from 'part:@sanity/components/selects/default'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import {range} from 'lodash'
import StyleSelect from 'part:@sanity/components/selects/style'
import RadioSelect from 'part:@sanity/components/selects/radio'

import Fuse from 'fuse.js'

import Chance from 'chance'
const chance = new Chance()

import {withKnobs, boolean, text, number, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const items = range(20).map((item, i) => {
  return {
    title: chance.name(),
    key: `${i}`
  }
})

const radioItems = range(10).map((item, i) => {
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

const renderStyleItem = function(item) {
  switch (item.key) {
    case 'style-paragraph':
      return <div style={{fontSize: '1em', fontWeight: 'normal'}}>{item.title}</div>
    case 'style-heading1':
      return <div style={{fontSize: '2em', fontWeight: 'bold'}}>{item.title}</div>
    case 'style-heading2':
      return <div style={{fontSize: '1.5em', fontWeight: 'bold'}}>{item.title}</div>
    case 'style-heading3':
      return <div style={{fontSize: '1.2em', fontWeight: 'bold'}}>{item.title}</div>
    default:
      return <div>Style: {item.title}</div>
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
    console.log('Value to string:', item, item.title) // eslint-disable-line
    if (item) {
      return item.title
    }

    return ''
  }

  handleSearch = query => {
    console.log('query2', query) // eslint-disable-line
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
        isLoading={this.state.loading}
        items={this.state.searchResult}
        value={this.state.value}
        renderItem={this.renderItem}
        valueToString={this.renderValue}
      />
    )
  }
}

storiesOf('Selects')
  .addDecorator(withKnobs)
  .add('Default', () => {
    const options = {
      range: true,
      min: 0,
      max: items.length,
      step: 1
    }
    const valueIndex = number('Selected item', -1, options)
    return (
      <Sanity part="part:@sanity/components/selects/default" propTables={[DefaultSelect]}>
        <DefaultSelect
          label={text('label (prop)', 'This is the label')}
          placeholder={text('placeholder (prop)', 'This is the placeholder')}
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onBlur={action('onBlur')}
          items={items}
          value={items[valueIndex]}
          disabled={boolean('disabled (default prop)', false)}
        />
      </Sanity>
    )
  })
  .add('Default with value', () => {
    return (
      <Sanity part="part:@sanity/components/selects/default" propTables={[DefaultSelect]}>
        <DefaultSelect
          label={text('label (prop)', 'This is the label')}
          placeholder={text('placeholder (prop)', 'This is the placeholder')}
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onBlur={action('onBlur')}
          value={items[10]}
          items={items}
          disabled={boolean('disabled (default prop)', false)}
        />
      </Sanity>
    )
  })

  .add(
    'Searchable',
    // `
    //   When provided with items, the component searches inside these when no onInputChange is provided
    // `,
    () => {
      const renderItem = function(item) {
        return <div>{item.title}</div>
      }
      const hasOnclear = boolean('has onClear')
      const selected = number('Selected item (value)', -1, {
        range: true,
        min: -1,
        max: items.length,
        step: 1
      })
      const selectedItem = items[selected]
      return (
        <Sanity part="part:@sanity/components/selects/searchable" propTables={[SearchableSelect]}>
          <SearchableSelect
            label={text('label (prop)', 'This is the label')}
            placeholder={text('placeholder (prop)', 'This is the placeholder')}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onBlur={action('onBlur')}
            onOpen={action('onOpen')}
            value={selectedItem}
            inputValue={text('Inputvalue (prop)', selectedItem && selectedItem.title)}
            renderItem={renderItem}
            items={items}
            isLoading={boolean('isLoading (prop)', false)}
            disabled={boolean('disabled (prop)', false)}
            onClear={hasOnclear ? action('onClear') : undefined}
          />
        </Sanity>
      )
    }
  )
  .add('Style select', () => {
    return (
      <Sanity part="part:@sanity/components/selects/style" propTables={[StyleSelect]}>
        <div style={{padding: '2em', backgroundColor: '#eee'}}>
          <StyleSelect
            label={text('label (prop)', 'This is the label')}
            placeholder={text('placeholder (prop)', 'This is the placeholder')}
            transparent={boolean('transparent (prop)', false)}
            disabled={boolean('disabled (prop)', false)}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onOpen={action('onOpen')}
            renderItem={renderStyleItem}
            items={styleItems}
          />
        </div>
      </Sanity>
    )
  })

  .add('Style select (one style)', () => {
    return (
      <Sanity part="part:@sanity/components/selects/style" propTables={[StyleSelect]}>
        <div style={{padding: '2em', backgroundColor: '#eee'}}>
          <StyleSelect
            label={text('label (prop)', 'This is the label')}
            placeholder={text('placeholder (prop)', 'This is the placeholder')}
            transparent={boolean('transparent (prop)', false)}
            disabled={boolean('disabled (prop)', false)}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onOpen={action('onOpen')}
            renderItem={renderStyleItem}
            value={[styleItems[0]]}
            items={styleItems}
          />
        </div>
      </Sanity>
    )
  })

  .add('Style select (multiple)', () => {
    return (
      <Sanity part="part:@sanity/components/selects/style" propTables={[StyleSelect]}>
        <div style={{padding: '2em', backgroundColor: '#eee'}}>
          <StyleSelect
            label={text('label (prop)', 'This is the label')}
            placeholder={text('placeholder (prop)', 'This is the placeholder')}
            transparent={boolean('transparent (prop)', false)}
            disabled={boolean('disabled (prop)', false)}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onOpen={action('onOpen')}
            renderItem={renderStyleItem}
            value={[styleItems[0], styleItems[2]]}
            items={styleItems}
          />
        </div>
      </Sanity>
    )
  })

  .add('Searchable example', () => {
    return (
      <div>
        <SearchableTest />
        This text should be behind the dropdown
      </div>
    )
  })

  .add(
    'Radiobuttons',
    // `
    //   When an onInputChange is provided. Populate the items, and remember to set _loading prop_ when waiting for server.
    // `,
    () => {
      const value =
        radioItems[number('value', 0, {range: true, min: 0, max: radioItems.length - 1})]

      return (
        <Sanity part="part:@sanity/components/selects/radio" propTables={[RadioSelect]}>
          <RadioSelect
            items={radioItems}
            value={value}
            onChange={action('onChange')}
            legend={text('legend (prop)', 'Radio button select')}
            direction={select('direction (prop)', [false, 'vertical', 'vertical'])}
          />
        </Sanity>
      )
    }
  )
