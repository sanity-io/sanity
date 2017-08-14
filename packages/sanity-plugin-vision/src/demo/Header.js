import React, {PropTypes} from 'react'

export default function Header({projects, selectedProjectId, onProjectChange}) {
  return (
    <div className="header">
      <div className="home-menu pure-menu pure-menu-horizontal">
        <a className="pure-menu-heading" href="/">SanityVision</a>

        <ul className="pure-menu-list">
          <li className="pure-menu-item pure-menu-selected">
            <select defaultValue={selectedProjectId} name="projectId" onChange={onProjectChange}>
              {projects.map(({projectId, displayName}) => (
                <option key={projectId} value={projectId}>{displayName}</option>
              ))}
            </select>
          </li>
        </ul>
      </div>
    </div>
  )
}

Header.propTypes = {
  selectedProjectId: PropTypes.string,
  onProjectChange: PropTypes.func.isRequired,
  projects: PropTypes.arrayOf(PropTypes.shape({
    projectId: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired
  }))
}
