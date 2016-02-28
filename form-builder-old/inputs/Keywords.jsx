import React from 'react'

const Keyword = React.createClass({
  removeKeyword() {
    this.props.onRemoveKeyword(this.props.keyword)
  },
  render() {
    return (
      <li className="tag-input__tag">
        <span className="tag-input__tag-name">{this.props.keyword.value}</span>
        <a className="tag-input__tag-remove" onClick={this.removeKeyword}>Remove</a>
      </li>
    )
  }
})

const KeywordList = React.createClass({
  removeKeyword(keyword) {
    this.props.onRemoveKeyword(keyword)
  },
  render() {
    const keywordNodes = this.props.keywords.map( (keyword) => {
      const removeKeyword = () => this.removeKeyword(keyword)
      return (
        <Keyword key={keyword} keyword={keyword} onRemoveKeyword={removeKeyword}/>
      )
    })
    return (
      <ul className="tag-input__tag-list">
        {keywordNodes}
      </ul>
    )
  }
})

export default React.createClass({

  addKeyword(keyword) {
    this.props.onAddKeyword( keyword )

  },

  removeKeyword(keyword) {
    this.props.onRemoveKeyword( keyword )
  },

  onKeyDown(event) {
    const code = event.keyCode
    if (code === 13) { // enter key
      this.addKeyword(event.target.value)
      event.target.value = ''
    }
    if (code === 8) { // delete key
      this.removeKeyword(this.props.keywords[this.props.keywords.length - 1])
    }
  },

  render() {
    const {keywords} = this.props
    return (
      <div className="tag-input keywords-input">
        <div className="tag-input__box">
          <KeywordList keywords={keywords} onRemoveKeyword={this.removeKeyword} onAddKeyword={this.addKeyword}/>
          <input className="tag-input__input-field" onKeyDown={this.onKeyDown}/>
        </div>
      </div>
    )
  }
})
