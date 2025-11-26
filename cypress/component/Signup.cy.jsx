import React from 'react'
import { mount } from '@cypress/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../src/Components/AuthContext.jsx'
import Signup from '../../src/Components/Signup.jsx'

describe('<Signup /> Component', () => {
  let mockLogin

  beforeEach(() => {
    // Create stub inside beforeEach
    mockLogin = cy.stub().as('loginStub')

    // Mock API response for successful signup
    cy.intercept('POST', 'http://localhost:3000/signup', {
      statusCode: 200,
      body: {
        user: {
          username: 'testuser',
          email: 'test@mail.com',
          phone: '0712345678'
        }
      }
    }).as('signupRequest')

    mount(
      <AuthContext.Provider value={{ login: mockLogin }}>
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      </AuthContext.Provider>
    )
  })

  it('renders signup form correctly', () => {
    cy.contains('Sign Up').should('be.visible')
    cy.get('input[placeholder="Username"]').should('exist')
    cy.get('input[placeholder="Email"]').should('exist')
    cy.get('input[placeholder="Password"]').should('exist')
    cy.get('input[placeholder="Phone"]').should('exist')
    cy.get('button[type="submit"]').should('contain.text', 'Sign Up')
  })

  it('handles successful signup', () => {
    cy.get('input[placeholder="Username"]').type('tester')
    cy.get('input[placeholder="Email"]').type('test@mail.com')
    cy.get('input[placeholder="Password"]').type('123456')
    cy.get('input[placeholder="Phone"]').type('0712345678')
    cy.get('button[type="submit"]').click()

    cy.wait('@signupRequest')

    cy.get('@loginStub').should('have.been.calledOnceWith', {
      email: 'test@mail.com',
      username: 'testuser',
      phone: '0712345678'
    })

    cy.contains('Account created for testuser!').should('be.visible')
  })

  it('shows error message for failed signup', () => {
    cy.intercept('POST', 'http://localhost:3000/signup', {
      statusCode: 400,
      body: { error: 'Email already registered' }
    }).as('badSignup')

    cy.get('input[placeholder="Username"]').type('tester')
    cy.get('input[placeholder="Email"]').type('duplicate@mail.com')
    cy.get('input[placeholder="Password"]').type('123456')
    cy.get('input[placeholder="Phone"]').type('0712345678')
    cy.get('button[type="submit"]').click()

    cy.wait('@badSignup')
    cy.contains('Email already registered').should('be.visible')
  })
})
