const el = (name) => `[data-testid="${name}"]`
const allGroups = Array.from(Array(10).keys()).map((n, i) => el(`group-group${i + 1}`))

describe('@sanity/form-builder: field groups', () => {
  it('does not render group tabs if no groups are defined in schema', () => {
    cy.visit(
      '/test/desk/input-debug;field-groups;readOnlyTest;9c0979b7-a202-44a3-a645-88a93499b47c'
    )
    cy.get(el('field-groups')).should('not.exist')
  })

  it('renders group buttons', () => {
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')
    cy.get(el('field-groups')).should('be.visible')
    cy.get(el('group-all-fields')).should('be.visible').should('have.attr', 'aria-selected', 'true')
  })

  it('focuses first group on initial render', () => {
    // First field when no default group is focused
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')
    cy.get(el('group-all-fields')).should('be.focused')

    // First field in default group is focused
    cy.visit(
      '/test/desk/input-debug;field-groups;fieldGroupsDefault;f61b9762-3519-43f2-acc3-97ee709e2131'
    )
    cy.get(el('group-group2')).should('be.focused')
  })

  it('(mouse) filters field based on active group', () => {
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')

    // Click on Group 1
    cy.get(el('group-group1')).click()
    cy.get(el('input-field1')).should('be.visible')
    cy.get(el('input-field2')).should('not.exist')
    cy.get(el('input-field3')).should('not.exist')
    cy.get(el('input-field4')).should('be.visible')

    // Click on group 2
    cy.get(el('group-group2')).click()
    cy.get(el('input-field1')).should('not.exist')
    cy.get(el('input-field2')).should('be.visible')
    cy.get(el('input-field3')).should('not.exist')
    cy.get(el('input-field4')).should('be.visible')
  })

  it('(keyboard) filters field based on active group', () => {
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')
    cy.get(el('group-all-fields')).type('{rightarrow}')
    cy.get(el('group-group1'))
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

  it('disables groups when opening changes panel and show all fields', () => {
    cy.visit('/test/desk/input-debug;field-groups;fieldGroups;c04d9594-b242-44ed-8da0-f6b5ff93f312')
    cy.get(el('group-group1')).click()
    cy.get(el('review-changes-button')).click()
    cy.get(el('group-all-fields')).should('have.attr', 'disabled')
    cy.get(el('group-group1')).should('have.attr', 'disabled')
    cy.get(el('group-group2')).should('have.attr', 'disabled')
  })

  it('filters fields by default group on initial render and show group as active', () => {
    cy.visit(
      '/test/desk/input-debug;field-groups;fieldGroupsDefault;f61b9762-3519-43f2-acc3-97ee709e2131'
    )
    cy.get(el('group-group2')).should('have.attr', 'aria-selected', 'true').should('be.focused')
  })

  it('wraps groups when there are a lot of them and there is no space', () => {
    cy.visit(
      '/test/desk/input-debug;field-groups;fieldGroupsMany;6fadd710-11cf-4ee0-8360-2696bc723a7c'
    )
    allGroups.forEach((groupName) => {
      cy.get(groupName).should('be.visible')
    })
  })

  it('switches group and scrolls to field when clicking validation error that is not in active group', () => {
    // todo
    // navigate to group without validation error
    // open validation menu
    // click on validation error that is not in current group
    // expect field with the validation error you clicked is visible and gets focused
  })

  it('navigates to document and focuses on correct field when clicking someones presence marker', () => {
    // todo
  })

  /* RESPONSIVENESS TESTS */
  it('uses dropdown selector instead of tabs when on small screens', () => {
    // todo
  })

  it('renders all groups in dropdown selector', () => {
    // todo
  })

  it('filters fields when using dropdown selector', () => {
    // todo
  })
})
