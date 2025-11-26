// cypress/support/component.js

import './commands'
import { mount } from '@cypress/react'  // <-- fix here

Cypress.Commands.add('mount', mount)

// Example use:
// cy.mount(<MyComponent />)
