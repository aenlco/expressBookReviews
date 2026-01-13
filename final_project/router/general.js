const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// --- Helper function to check if a user exists ---
const doesExist = (username) => {
  let userswithsamename = users.filter((user) => {
    return user.username === username;
  });
  return userswithsamename.length > 0;
}

// --- Register a new user ---
public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username && password) {
    if (!doesExist(username)) {
      users.push({ "username": username, "password": password });
      return res.status(200).json({ message: "User successfully registered. Now you can login" });
    } else {
      return res.status(404).json({ message: "User already exists!" });
    }
  }
  return res.status(404).json({ message: "Unable to register user. Please provide username and password." });
});

// --- Get the book list available in the shop (Async) ---
public_users.get('/', async function (req, res) {
  // Simulating an async database call with a Promise
  const getBooks = new Promise((resolve, reject) => {
    try {
      resolve(books);
    } catch (err) {
      reject(err);
    }
  });

  try {
    const bookList = await getBooks;
    return res.status(200).send(JSON.stringify(bookList, null, 4));
  } catch (error) {
    return res.status(500).json({ message: "Error fetching books" });
  }
});

// --- Get book details based on ISBN (Async) ---
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  // Using Promise syntax (.then)
  new Promise((resolve, reject) => {
    const book = books[isbn];
    if (book) {
      resolve(book);
    } else {
      reject("Book not found");
    }
  })
  .then((book) => {
    return res.status(200).json(book);
  })
  .catch((err) => {
    return res.status(404).json({ message: err });
  });
});

// --- Get book details based on author (Async) ---
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;

  const getBooksByAuthor = new Promise((resolve, reject) => {
    let booksByAuthor = [];
    const isbns = Object.keys(books);
    
    // Iterate through books to find matching author
    isbns.forEach((isbn) => {
      if (books[isbn].author === author) {
        booksByAuthor.push({
          isbn: isbn,
          title: books[isbn].title,
          reviews: books[isbn].reviews
        });
      }
    });

    if (booksByAuthor.length > 0) {
      resolve(booksByAuthor);
    } else {
      reject("No books found by this author");
    }
  });

  try {
    const result = await getBooksByAuthor;
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({ message: error });
  }
});

// --- Get all books based on title (Async) ---
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title;

  const getBooksByTitle = new Promise((resolve, reject) => {
    let booksByTitle = [];
    const isbns = Object.keys(books);

    isbns.forEach((isbn) => {
      if (books[isbn].title === title) {
        booksByTitle.push({
          isbn: isbn,
          author: books[isbn].author,
          reviews: books[isbn].reviews
        });
      }
    });

    if (booksByTitle.length > 0) {
      resolve(booksByTitle);
    } else {
      reject("No books found with this title");
    }
  });

  try {
    const result = await getBooksByTitle;
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({ message: error });
  }
});

// --- Get book review ---
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  
  // Even though simple, we wrap in logic to check existence
  if (books[isbn]) {
    return res.status(200).json(books[isbn].reviews);
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});

module.exports.general = public_users;