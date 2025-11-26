import React from 'react'
import { mount } from '@cypress/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../src/Components/AuthContext.jsx'
import Login from '../../src/Components/Login.jsx'

describe('<Login /> Component', () => {
  let mockLogin  // <-- declare variable at top level, but don't assign cy.stub yet

  beforeEach(() => {
    // Create the stub inside the hook
    mockLogin = cy.stub().as('mockLogin')

    // Default successful login intercept
    cy.intercept('POST', 'http://localhost:3000/login', {
      statusCode: 200,
      body: { user: { email: 'test@example.com', username: 'Tester' } },
    }).as('loginRequest')

    // Mount component
    mount(
      <AuthContext.Provider value={{ login: mockLogin }}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    )
  })

  it('renders login form', () => {
    cy.contains('Login').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('contain.text', 'Login')
  })

  it('shows error for wrong credentials', () => {
    cy.intercept('POST', 'http://localhost:3000/login', {
      statusCode: 401,
      body: { error: 'wrong password or email' },
    }).as('badLogin')

    cy.get('input[type="email"]').type('wrong@mail.com')
    cy.get('input[type="password"]').type('badpass')
    cy.get('button[type="submit"]').click()

    cy.wait('@badLogin')
    cy.contains('wrong password or email').should('be.visible')
  })

  it('logs in successfully', () => {
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('123456')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginRequest')
    cy.get('@mockLogin').should('have.been.calledOnce')
    cy.contains('Welcome back, Tester').should('be.visible')
  })
})
