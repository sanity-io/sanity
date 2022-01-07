const el = (name) => `[data-testid="${name}"]`
const allGroups = Array.from(Array(10).keys()).map((n, i) => `group${i + 1}`)

const commonTests = () => {
  it('does not render group tabs if no groups are defined in schema', () => {
    cy.visit(
      '/test/desk/input-debug;field-groups;readOnlyTest;9c0979b7-a202-44a3-a645-88a93499b47c'
    )
    cy.get(el('field-groups-root')).should('not.exist')
  })
  it('renders group buttons', () => {
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')
    cy.get(el('field-group-root')).should('exist')
  })
}

describe('@sanity/form-builder: field groups with review changes', () => {
  it('disables groups when opening changes panel and switches to all fields', () => {
    cy.viewport(2000, 2500)
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000)
    cy.get(el('group-tab-group1')).click()
    cy.get(el('review-changes-button')).click()
    cy.get(el('group-tab-all-fields')).should('have.attr', 'disabled')
    cy.get(el('group-tab-group1')).should('have.attr', 'disabled')
    cy.get(el('group-tab-group2')).should('have.attr', 'disabled')
  })
})

describe('@sanity/form-builder: field groups on desktop', () => {
  beforeEach(() => {
    cy.viewport(2000, 2500)
  })

  commonTests()

  it('renders groups in tabs', () => {
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')
    cy.get(el('field-group-select')).should('not.be.visible')
    cy.get(el('field-group-tabs')).should('be.visible')
    cy.get(el('group-tab-all-fields'))
      .should('be.visible')
      .should('have.attr', 'aria-selected', 'true')
  })

  it('shows first group as active on initial render', () => {
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')
    cy.get(el('group-tab-all-fields')).should('have.attr', 'aria-selected', 'true')
  })

  it('shows default group as active on initial render', () => {
    cy.visit(
      '/test/desk/input-debug;field-groups;fieldGroupsDefault;f61b9762-3519-43f2-acc3-97ee709e2131'
    )
    cy.get(el('group-tab-group2')).should('have.attr', 'aria-selected', 'true')
  })

  it('(mouse) filters field based on active group', () => {
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')

    // Click on Group 1
    cy.get(el('group-tab-group1')).click()
    cy.get(el('input-field1')).should('be.visible')
    cy.get(el('input-field2')).should('not.exist')
    cy.get(el('input-field3')).should('not.exist')
    cy.get(el('input-field4')).should('be.visible')

    // Click on group 2
    cy.get(el('group-tab-group2')).click()
    cy.get(el('input-field1')).should('not.exist')
    cy.get(el('input-field2')).should('be.visible')
    cy.get(el('input-field3')).should('not.exist')
    cy.get(el('input-field4')).should('be.visible')
  })

  it('(keyboard) filters field based on active group', () => {
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')
    cy.get(el('group-tab-all-fields')).type('{rightarrow}')
    cy.get(el('group-tab-group1'))
      .trigger('click')
      .should('have.attr', 'aria-selected', 'true')
      .should('be.focused')
    cy.get(el('input-field1')).should('be.visible')
    cy.get(el('input-field2')).should('not.exist')
    cy.get(el('input-field3')).should('not.exist')
    cy.get(el('input-field4')).should('be.visible')
    cy.get(el('input-fieldGroup')).should('be.visible')

    // @todo
    // Test shift+tab to go back to the groups and choose another group
  })

  it('wraps groups when there are a lot of them and there is no space', () => {
    cy.visit(
      '/test/desk/input-debug;field-groups;fieldGroupsMany;6fadd710-11cf-4ee0-8360-2696bc723a7c'
    )
    allGroups.forEach((groupName) => {
      cy.get(el(`group-tab-${groupName}`)).should('be.visible')
    })
  })
})

describe('@sanity/form-builder: field groups on mobile', () => {
  beforeEach(() => {
    cy.viewport(320, 568)
  })

  commonTests()

  it('renders field groups in select input', () => {
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')
    cy.get(el('field-group-select')).should('be.visible')
    cy.get(el('field-group-tabs')).should('not.be.visible')
    cy.get(el('group-select-group1')).should('exist')
    cy.get(el('group-select-group2')).should('exist')
  })

  it('shows first group in select on initial render', () => {
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')
    cy.get(el('field-group-select')).should('have.value', 'all-fields')
    cy.get(el('group-select-all-fields')).should('have.attr', 'aria-selected', 'true')
  })

  it('shows default group in select on initial render', () => {
    cy.visit(
      '/test/desk/input-debug;field-groups;fieldGroupsDefault;f61b9762-3519-43f2-acc3-97ee709e2131'
    )
    cy.get(el('field-group-select')).should('have.value', 'group2')
    cy.get(el('group-select-group2')).should('have.attr', 'aria-selected', 'true')
  })

  it('filters field based on active group', () => {
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')
    cy.get(el('field-group-select')).select('group1').should('have.value', 'group1')
    cy.get(el('group-select-group1')).should('have.attr', 'aria-selected', 'true')
    cy.get(el('input-field1')).should('be.visible')
    cy.get(el('input-field2')).should('not.exist')
    cy.get(el('input-field3')).should('not.exist')
    cy.get(el('input-field4')).should('be.visible')
    cy.get(el('input-fieldGroup')).should('be.visible')
  })
})

describe('@sanity/form-builder: field groups with validation markers', () => {
  const VALIDATION_DOCUMENT_URI =
    '/test/desk/input-debug;field-groups;fieldGroupsWithValidation;713f9e6d-06ad-4b2b-b164-bc8cd6d52553'

  beforeEach(() => {
    cy.viewport(2000, 2500)
  })

  commonTests()

  it('switches group and scrolls to field when clicking validation error that is not in active group', () => {
    cy.visit(VALIDATION_DOCUMENT_URI)
    cy.get(el('group-tab-all-fields')).type('{rightarrow}')
    cy.get(el('group-tab-group1'))
      .click()
      .should('have.attr', 'aria-selected', 'true')
      .should('be.focused')
    cy.get(el('input-field1')).should('be.visible')
    cy.get(el('input-field2')).should('not.exist')
    cy.get(el('input-field3')).should('be.visible')
    cy.get(el('input-field4')).should('be.visible')
    cy.get(el('input-fieldGroup')).should('be.visible')
    cy.get(el('validation-list-button'))
      .trigger('click')
      .should('have.attr', 'aria-expanded', 'true')
    cy.get(el('validation-list')).get('[data-ui="MenuItem"]').eq(0).trigger('click')
    cy.get(el('group-tab-all-fields')).should('have.attr', 'aria-selected', 'true')
    cy.get(el('input-field2')).should('be.visible')
    cy.get(el('input-field2')).get('input').should('be.focused')
  })

  it('stays in group and scrolls to field when clicking validation error that is in active group', () => {
    cy.visit(VALIDATION_DOCUMENT_URI)
    cy.get(el('group-tab-group2'))
      .click()
      .should('have.attr', 'aria-selected', 'true')
      .should('be.focused')
    cy.get(el('input-field2')).should('be.visible')
    cy.get(el('validation-list-button'))
      .trigger('click')
      .should('have.attr', 'aria-expanded', 'true')
    cy.get(el('validation-list')).get('[data-ui="MenuItem"]').eq(0).trigger('click')
    cy.get(el('group-tab-group2')).should('have.attr', 'aria-selected', 'true')
    cy.get(el('input-field2')).should('be.visible')
    cy.get(el('input-field2')).get('input').should('be.focused')
  })
})

describe('@sanity/form-builder: field groups with presence', () => {
  const VALIDATION_DOCUMENT_WITH_DEFAULT_GROUP_URI =
    '/test/desk/input-debug;field-groups;fieldGroupsDefault;f61b9762-3519-43f2-acc3-97ee709e2131'

  beforeEach(() => {
    cy.viewport(2000, 2500)
  })

  commonTests()

  it('navigates to document and focuses on correct field when clicking someones presence marker', () => {
    cy.visit(`${VALIDATION_DOCUMENT_WITH_DEFAULT_GROUP_URI}%2Cpath%3Dfield3`)
    cy.get(el('group-tab-all-fields')).should('have.attr', 'aria-selected', 'true')
    cy.get(el('input-field3')).should('be.visible')
    cy.get(el('input-field3')).get('input').should('be.focused')
  })
})
