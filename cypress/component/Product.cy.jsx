// cypress/e2e/Product.cy.jsx
import React from 'react'
import { mount } from '@cypress/react'
import Product from '../../src/Components/Product.jsx'

describe('<Product /> Component', () => {
  beforeEach(() => {
    // Intercept products API and serve fixture
    cy.intercept('GET', 'http://localhost:3000/products', { fixture: 'example.json' }).as('getProducts')
    
    // Mount the component
    mount(<Product />)
    
    // Wait for the products to load
    cy.wait('@getProducts')
  })

  it('renders the page title', () => {
    cy.contains('Our Products').should('be.visible')
  })

  it('loads product cards', () => {
    cy.get('.product-card:visible').should('have.length.greaterThan', 0)
    cy.contains('Add to Cart').should('exist')
  })

  it('filters products by brand', () => {
  // Select 'Dell' in the brand dropdown
  cy.contains('label', 'Brand:').parent().find('select').select('Dell')

  // Wait for filtered products to render
  cy.get('.product-card:visible', { timeout: 5000 }).should('exist')

  // Assert that all visible products have brand 'Dell'
  cy.get('.product-card:visible').each(($card) => {
    cy.wrap($card).find('h2').invoke('text').should('match', /Dell/i)
  })
})

  it('adds a product to the cart and shows alert', () => {
    // Click the first 'Add to Cart' button
    cy.get('.product-card:visible').first().within(() => {
      cy.contains('Add to Cart').click()
    })

    // Verify alert appears
    cy.contains('added to cart', { matchCase: false }).should('exist')
  })
})
