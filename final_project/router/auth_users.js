const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Check if a username exists
const isValid = (username) => { 
  let userswithsamename = users.filter((user) => {
    return user.username === username;
  });
  return userswithsamename.length > 0;
}

// Check if username and password match the one we have in records
const authenticatedUser = (username, password) => { 
  let validusers = users.filter((user) => {
    return (user.username === username && user.password === password);
  });
  return validusers.length > 0;
}

// --- TASK 7: Login as a Registered User (Async) ---
regd_users.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in. Please provide both username and password." });
  }

  // Wrap authentication in a Promise to make it asynchronous
  const checkCredentials = new Promise((resolve, reject) => {
    if (authenticatedUser(username, password)) {
      resolve();
    } else {
      reject();
    }
  });

  try {
    await checkCredentials;

    // Generate JWT access token
    let accessToken = jwt.sign({
      data: password
    }, 'access', { expiresIn: 60 * 60 }); // Expires in 1 hour

    // Save user session
    req.session.authorization = {
      accessToken,
      username
    };

    return res.status(200).send("User successfully logged in");

  } catch (error) {
    return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }
});

// --- TASK 8: Add or Modify a Book Review (Async) ---
regd_users.put("/auth/review/:isbn", async (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review; // Reviews are typically sent as query parameters in this specific lab
  const username = req.session.authorization['username']; // Retrieve username from session

  // Simulate async book lookup
  const findBook = new Promise((resolve, reject) => {
    if (books[isbn]) {
      resolve(books[isbn]);
    } else {
      reject("Book not found");
    }
  });

  try {
    let book = await findBook;

    // If the user has already reviewed this book, this will overwrite it (modify)
    // If it's a new review, it will be added
    book.reviews[username] = review;

    return res.status(200).send(`The review for the book with ISBN ${isbn} has been added/updated.`);
    
  } catch (error) {
    return res.status(404).json({ message: "Invalid ISBN" });
  }
});

// --- Delete a Book Review (Bonus/Optional) ---
// This deletes the review for the specific logged-in user
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization['username'];

    if (books[isbn]) {
        if(books[isbn].reviews[username]) {
            delete books[isbn].reviews[username];
            return res.status(200).send(`Review for ISBN ${isbn} posted by user ${username} deleted.`);
        } else {
            return res.status(404).json({message: "No review found for this user on this book."});
        }
    } else {
        return res.status(404).json({message: "Invalid ISBN"});
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;