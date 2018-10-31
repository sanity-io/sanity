/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import DefaultSelect from 'part:@sanity/components/selects/default'
import SearchableSelect from 'part:@sanity/components/selects/searchable'
import {range} from 'lodash'
import StyleSelect from 'part:@sanity/components/selects/style'
import RadioSelect from 'part:@sanity/components/selects/radio'
import {withKnobs, boolean, text, number, select, color} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import Fuse from 'fuse.js'

import Chance from 'chance'

const chance = new Chance()

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

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: 0,
  left: 0
}

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
      <div
        style={{
          ...centerStyle,
          color: color('color', undefined, 'test'),
          backgroundColor: color('background color', undefined, 'test')
        }}
      >
        <Sanity part="part:@sanity/components/selects/default" propTables={[DefaultSelect]}>
          <DefaultSelect
            label={text('label', 'This is the label', 'props')}
            placeholder={text('placeholder', 'This is the placeholder', 'props')}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onBlur={action('onBlur')}
            items={items}
            value={items[valueIndex]}
            disabled={boolean('disabled', false, 'props')}
          />
        </Sanity>
      </div>
    )
  })
  .add('Default with value', () => {
    return (
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/selects/default" propTables={[DefaultSelect]}>
          <DefaultSelect
            label={text('label', 'This is the label', 'props')}
            placeholder={text('placeholder', 'This is the placeholder', 'props')}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onBlur={action('onBlur')}
            value={items[10]}
            items={items}
            disabled={boolean('disabled', false, 'props')}
          />
        </Sanity>
      </div>
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
      const hasOnclear = boolean('has onClear', false, 'test')
      const selected = number('Selected item (value)', -1, {
        range: true,
        min: -1,
        max: items.length,
        step: 1
      })
      const selectedItem = items[selected]
      return (
        <div style={{minWidth: '320px', ...centerStyle}}>
          <Sanity part="part:@sanity/components/selects/searchable" propTables={[SearchableSelect]}>
            <SearchableSelect
              label={text('label', 'This is the label', 'props')}
              placeholder={text('placeholder', 'This is the placeholder', 'props')}
              onChange={action('onChange')}
              onFocus={action('onFocus')}
              onBlur={action('onBlur')}
              onOpen={action('onOpen')}
              value={selectedItem}
              inputValue={text('Inputvalue', selectedItem && selectedItem.title, 'props')}
              renderItem={renderItem}
              items={items}
              isLoading={boolean('isLoading', false, 'props')}
              disabled={boolean('disabled (prop)', false, 'props')}
              onClear={hasOnclear ? action('onClear') : undefined}
            />
          </Sanity>
        </div>
      )
    }
  )
  .add('Style select', () => {
    return (
      <Sanity part="part:@sanity/components/selects/style" propTables={[StyleSelect]}>
        <div style={centerStyle}>
          <StyleSelect
            label={text('label', 'This is the label', 'props')}
            placeholder={text('placeholder', 'This is the placeholder', 'props')}
            transparent={boolean('transparent', false, 'props')}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onOpen={action('onOpen')}
            renderItem={renderStyleItem}
            items={styleItems}
            // value={select(
            //   'value',
            //   {
            //     'No value': undefined,
            //     'One value': [styleItems[0]],
            //     'Multiple values': [styleItems[0], styleItems[2]]
            //   },
            //   undefined,
            //   'props'
            // )}
          />
        </div>
      </Sanity>
    )
  })

  .add('Searchable example', () => {
    return (
      <div style={centerStyle}>
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
        radioItems[number('value', 0, {range: true, min: 0, max: radioItems.length - 1}, 'props')]

      return (
        <div style={{...centerStyle, padding: '2rem'}}>
          <Sanity part="part:@sanity/components/selects/radio" propTables={[RadioSelect]}>
            <RadioSelect
              items={radioItems}
              value={value}
              onChange={action('onChange')}
              legend={text('legend', 'Radio button select', 'props')}
              direction={select('direction', [false, 'vertical', 'vertical'], undefined, 'props')}
            />
          </Sanity>
        </div>
      )
    }
  )
