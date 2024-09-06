/**
 * File Name: app.spec.js
 * Description: This file contains unit tests for the "In-N-Out-Books" application.
 * Author: Amanda Rovey
 * Date: September 4th, 2024
 */

const request = require('supertest');
const app = require('../src/app');

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