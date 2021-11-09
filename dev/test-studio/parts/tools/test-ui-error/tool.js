import React, {useCallback} from 'react'

export default {
  title: 'Test UI error',
  name: 'test-ui-error',
  component: TestUIErrorTool,
}

function TestUIErrorTool() {
  const handleThrowUIError = useCallback(() => {
    throw new Error('useRootTheme(): missing context value')
  }, [])

  return (
    <div style={{padding: 16}}>
      <button onClick={handleThrowUIError} type="button">
        Throw UI error
      </button>
    </div>
  )
}
