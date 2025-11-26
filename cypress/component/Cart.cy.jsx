import React from 'react'
import { mount } from '@cypress/react'
import Cart from '../../src/Components/Cart.jsx'

describe('<Cart /> Component', () => {
  beforeEach(() => {
    const mockCart = [
      { id: 1, name: 'Dell XPS', model: '2024', price: 10000, quantity: 1 },
      { id: 2, name: 'HP Envy', model: 'X360', price: 12000, quantity: 2 },
    ]
    localStorage.setItem('cart', JSON.stringify(mockCart))
  })

  it('renders cart items', () => {
    mount(<Cart />)
    cy.contains('Shopping Cart').should('be.visible')
    cy.contains('Dell XPS').should('be.visible')
    cy.contains('HP Envy').should('be.visible')
  })

  it('shows total correctly', () => {
    mount(<Cart />)
    cy.contains('Total: ZAR 34000').should('be.visible')
  })

  it('shows empty message when cart is cleared', () => {
    localStorage.setItem('cart', JSON.stringify([]))
    mount(<Cart />)
    cy.contains('Your cart is empty').should('be.visible')
  })
})
