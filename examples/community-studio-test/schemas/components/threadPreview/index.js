import React from 'react'
import unescape from 'lodash/unescape';
import ReactMarkdown  from'react-markdown'

const ThreadPreview = ({ document }) => {
  const { displayed = {} } = document
  const { thread } = displayed
  return (
    <div>
      <ul>
        {thread.map(({ _key, author, content, timestamp  }) => <li key={_key}>👤{author}: <ReactMarkdown source={unescape(content)} /> ({new Date(timestamp * 1000).toDateString()})</li>)}
      </ul>
      {/* <pre>{JSON.stringify(displayed, null, 2)}</pre> */}
    </div>
  )
}

export default ThreadPreview
