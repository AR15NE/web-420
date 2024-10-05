/**
 * File Name: app.spec.js
 * Description: This file contains unit tests for the "In-N-Out-Books" application.
 * Author: Amanda Rovey
 * Date: September 25th, 2024
 */

const request = require('supertest');
const app = require('../src/app');
const books = require('../database/books');

// Mock database
const mockBooks = [
  { id: 1, title: 'Book One', author: 'Author One' },
  { id: 2, title: 'Book Two', author: 'Author Two' }
];

// Mock the database methods
jest.mock('../database/books', () => ({
  find: jest.fn(() => Promise.resolve(mockBooks)),
  findOne: jest.fn((query) => Promise.resolve(mockBooks.find(book => book.id === query.id))),
  insertOne: jest.fn((newBook) => Promise.resolve(newBook)),
  deleteOne: jest.fn((query) => Promise.resolve({ deletedCount: mockBooks.find(book => book.id === query.id) ? 1 : 0 })),
  updateOne: jest.fn((query, update) => {
      const book = mockBooks.find(book => book.id === query.id);
      if (book) {
          Object.assign(book, update.$set);
          return Promise.resolve({ matchedCount: 1 });
      } else {
          return Promise.resolve({ matchedCount: 0 });
      }
  })
}));

// Mock the users collection
jest.mock('../database/users', () => {
  const bcrypt = require('bcryptjs');
  const saltRounds = 10;
  const users = [
    {
      id: 1,
      email: "harry@hogwarts.edu",
      password: bcrypt.hashSync("potter", saltRounds),
      securityQuestions: [
        { question: "What is your pet's name?", answer: "Hedwig" },
        { question: "What is your favorite book?", answer: "Quidditch Through the Ages" },
        { question: "What is your mother's maiden name?", answer: "Evans" },
      ]
    },
    {
      id: 2,
      email: "hermione@hogwarts.edu",
      password: bcrypt.hashSync("granger", saltRounds),
      securityQuestions: [
        { question: "What is your pet's name?", answer: "Crookshanks" },
        { question: "What is your favorite book?", answer: "Hogwarts: A History" },
        { question: "What is your mother's maiden name?", answer: "Wilkins" },
      ]
    },
    {
      id: 3,
      email: "ron@hogwarts.edu",
      password: bcrypt.hashSync("weasley", saltRounds),
      securityQuestions: [
        { question: "What is your pet's name?", answer: "Scabbers" },
        { question: "What is your favorite book?", answer: "The Quibbler" },
        { question: "What is your mother's maiden name?", answer: "Prewett" },
      ]
    },
    {
      id: 4,
      email: "test@example.com",
      password: bcrypt.hashSync("password123", saltRounds),
      securityQuestions: [
        { question: "What is your pet's name?", answer: "Fluffy" },
        { question: "What is your favorite book?", answer: "The Great Gatsby" },
        { question: "What is your mother's maiden name?", answer: "Smith" },
      ]
    },
  ];

  return {
    find: jest.fn((query) => Promise.resolve(users.find(user => user.email === query.email)))
  };
});

describe('Chapter 3: API Tests', () => {
    // Test for the GET route to return an array of books
    test('Should return an array of books', async () => {
        const response = await request(app).get('/api/books');
        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
    });

    // Test for the GET route to return a single book by id
    test('Should return a single book', async () => {
        const response = await request(app).get('/api/books/1');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', 1);
    });

    // Test for the GET route to return a 400 error if the id is not a number
    test('Should return a 400 error if the id is not a number', async () => {
        const response = await request(app).get('/api/books/abc');
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Invalid book id');
    });
});

describe('Chapter 4: API Tests', () => {
  // Test for adding a new book
  it('Should return a 201-status code when adding a new book', async () => {
      const newBook = { id: 3, title: 'Book Three', author: 'Author Three' };
      const response = await request(app)
          .post('/api/books')
          .send(newBook);
      expect(response.status).toBe(201);
      expect(response.body).toEqual(newBook);
  });

  // Test for adding a new book with missing title
  it('Should return a 400-status code when adding a new book with missing title', async () => {
      const newBook = { id: 4, author: 'Author Four' };
      const response = await request(app)
          .post('/api/books')
          .send(newBook);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Book title is required');
  });

  // Test for deleting a book
  it('Should return a 204-status code when deleting a book', async () => {
      const response = await request(app)
          .delete('/api/books/1');
      expect(response.status).toBe(204);
  });
});

describe('Chapter 5: API Tests', () => {
  // Test for updating a book and returning a 204-status code
  it('should update a book and return a 204-status code', async () => {
      const updatedBook = { title: 'Updated Book', author: 'Updated Author' };
      const response = await request(app)
          .put('/api/books/1')
          .send(updatedBook);
      expect(response.status).toBe(204);
  });

  // Test for returning a 400-status code when using a non-numeric id
  it('should return a 400-status code when using a non-numeric id', async () => {
      const updatedBook = { title: 'Updated Book', author: 'Updated Author' };
      const response = await request(app)
          .put('/api/books/foo')
          .send(updatedBook);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Input must be a number');
  });

  // Test for returning a 400-status code when updating a book with a missing title
  it('should return a 400-status code when updating a book with a missing title', async () => {
      const updatedBook = { author: 'Updated Author' };
      const response = await request(app)
          .put('/api/books/1')
          .send(updatedBook);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
  });
});

describe('Chapter 6: API Tests', () => {
  it('should log a user in and return a 200-status with "Authentication successful" message', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Authentication successful');
  });

  it('should return a 401-status code with "Unauthorized" message when logging in with incorrect credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('Unauthorized: Invalid email or password');
  });

  it('should return a 400-status code with "Bad Request" message when missing email or password', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com' });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Bad Request: Missing email or password');
  });
});


// Unit test for the post route that verifies a user's security quesitons
describe('Chapter 7: API Tests', () => {
  // Test for successful verification of security questions
  it('should return a 200 status with "Security questions successfully answered" message', async () => {
    const res = await request(app)
      .post('/api/users/test@example.com/verify-security-question')
      .send({ answers: [{ answer: 'Fluffy' }, { answer: 'The Great Gatsby' }, { answer: 'Smith' }] });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual('Security questions successfully answered');
  });

  // Test for invalid request body
  it('should return a 400 status code with "Bad Request" message when the request body fails ajv validation', async () => {
    const res = await request(app)
      .post('/api/users/test@example.com/verify-security-question')
      .send({ answers: [{ answer: 'Fluffy' }, { answer: 'The Great Gatsby' }] }); // Missing one answer
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual('Bad Request: Invalid request body');
  });

  // Test for incorrect answers
  it('should return a 401 status code with "Unauthorized" message when the security questions are incorrect', async () => {
    const res = await request(app)
      .post('/api/users/test@example.com/verify-security-question')
      .send({ answers: [{ answer: 'Wrong' }, { answer: 'Answers' }, { answer: 'Here' }] });
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('Unauthorized: Incorrect answers');
  });
});
