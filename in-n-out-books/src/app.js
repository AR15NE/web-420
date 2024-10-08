// Name: Amanda Rovey
// Date: September 25th, 2024
// File Name: app.js
// Description: This file sets up the initial project structure and creates the server for the "In-N-Out-Books" application. Inspired by a love of books, “In-N-Out-Books” caters to users who want to manage their personal or shared book collections.

// Require statements
const express = require('express');
const bcrypt = require('bcryptjs'); // Add bcryptjs for password hashing
const app = express();
const books = require('../database/books');
const users = require('../database/users'); // Assuming users.js exports an array of user objects

// Middleware functions
app.use(express.json()); // Parses incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses incoming requests with URL-encoded payloads
app.use(express.static('public')); // Serves static files from the 'public' directory

// Add a GET route for the root URL ("/")
app.get("/", async (req, res, next) => {
  // HTML content for the landing page
  const html = `
  <html>
  <head>
    <title>In-N-Out-Books</title>
    <style>
      body, h1, h2 { margin: 0; padding: 0; border: 0; }
      body {
        background: #f0f0f0;
        color: #333;
        margin: 1.25rem;
        font-size: 1.25rem;
        font-family: 'Arial', sans-serif;
      }
      h1, h2 { color: #333; font-family: 'Arial', sans-serif; text-align: center; }
      .container { width: 60%; margin: 0 auto; }
      .content {
        background: #fff;
        border: 1px solid #ccc;
        padding: 1rem;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .content h3 { margin-top: 0; }
      .content p { font-family: 'Arial', sans-serif; }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>In-N-Out-Books</h1>
        <h2>Manage Your Book Collection</h2>
      </header>
      <br />
      <main>
        <div class="content">
          <h3>Welcome</h3>
          <p>Welcome to In-N-Out-Books, a platform inspired by the love of books and designed to help you manage your own collection. Whether you are an avid reader keeping track of your reads or a book club organizer managing a shared collection, In-N-Out-Books caters to your needs.</p>
        </div>
      </main>
    </div>
  </body>
  </html>
  `; // end HTML content for the landing page
  res.send(html); // Sends the HTML content to the client
});

// GET route to return an array of books
app.get('/api/books', async (req, res) => {
    try {
        const allBooks = await books.find();
        res.json(allBooks);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching books' });
    }
});

// GET route to return a single book by id
app.get('/api/books/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid book id' });
        }
        const book = await books.findOne({ id });
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(book);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching the book' });
    }
});

// POST route to add a new book
app.post('/api/books', async (req, res) => {
  try {
      const { id, title, author } = req.body;
      if (!title) {
          return res.status(400).json({ error: 'Book title is required' });
      }
      const newBook = { id, title, author };
      await books.insertOne(newBook);
      res.status(201).json(newBook);
  } catch (error) {
      res.status(500).json({ error: 'An error occurred while adding the book' });
  }
});

// DELETE route to delete a book by id
app.delete('/api/books/:id', async (req, res) => {
  try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
          return res.status(400).json({ error: 'Invalid book id' });
      }
      const result = await books.deleteOne({ id });
      if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Book not found' });
      }
      res.status(204).send();
  } catch (error) {
      res.status(500).json({ error: 'An error occurred while deleting the book' });
  }
});

// PUT route to update a book by id
app.put('/api/books/:id', async (req, res) => {
  try {
      let id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
          return res.status(400).json({ error: 'Input must be a number' });
      }
      const { title, author } = req.body;
      if (!title) {
          return res.status(400).json({ error: 'Bad Request' });
      }
      const updatedBook = { id, title, author };
      const result = await books.updateOne({ id }, { $set: updatedBook });
      if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Book not found' });
      }
      res.status(204).send();
  } catch (err) {
      console.error('Error: ', err.message);
      res.status(500).json({ error: 'An error occurred while updating the book' });
  }
});

// POST route to log a user in
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email, password); // Log the login attempt

    if (!email || !password) {
      return res.status(400).json({ message: 'Bad Request: Missing email or password' });
    }

    const user = await users.find({ email });
    console.log('User found:', user); // Log the found user

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: Invalid email or password' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    console.log('Password valid:', isPasswordValid); // Log the password validation result

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Unauthorized: Invalid email or password' });
    }

    res.status(200).json({ message: 'Authentication successful' });
  } catch (error) {
    console.error('Error: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST route to verify security questions
app.post('/api/users/:email/verify-security-question', async (req, res) => {
  try {
    const { email } = req.params;
    const { answers } = req.body;

    // Validate request body using ajv
    const Ajv = require('ajv');
    const ajv = new Ajv();
    const schema = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          answer: { type: 'string' }
        },
        required: ['answer'],
        additionalProperties: false
      }
    };
    const validate = ajv.compile(schema);
    if (!validate(answers)) {
      return res.status(400).json({ message: 'Bad Request: Invalid request body' });
    }

    // Find user by email
    const user = await users.find({ email });
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    // Check if the number of answers matches the number of security questions
    if (answers.length !== user.securityQuestions.length) {
      return res.status(400).json({ message: 'Bad Request: Invalid request body' });
    }

    // Compare answers
    const isAnswersValid = user.securityQuestions.every((question, index) => {
      return question.answer === answers[index].answer;
    });

    if (!isAnswersValid) {
      return res.status(401).json({ message: 'Unauthorized: Incorrect answers' });
    }

    res.status(200).json({ message: 'Security questions successfully answered' });
  } catch (error) {
    console.error('Error: ', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// 404 Error Middleware
app.use((req, res, next) => {
  res.status(404).send('404 Not Found');
});

// 500 Error Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Export the Express application
module.exports = app;
