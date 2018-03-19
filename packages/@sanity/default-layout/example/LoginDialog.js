import React from 'react'

function login(e) {
  document.location.reload()
}

export default function LoginModal(props) {
  return (
    <div>
      <h2>Login</h2>
      <button type="button" onClick={login}>
        Log in as Catty Mc. Catface
      </button>
    </div>
  )
}
