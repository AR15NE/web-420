/**
 * File Name: app.spec.js
 * Description: This file contains unit tests for the "In-N-Out-Books" application.
 * Author: Amanda Rovey
 * Date: September 14th, 2024
 */

const request = require('supertest');
const app = require('../src/app');
const books = require('../database/books');

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
  deleteOne: jest.fn((query) => Promise.resolve({ deletedCount: mockBooks.find(book => book.id === query.id) ? 1 : 0 }))
}));

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
