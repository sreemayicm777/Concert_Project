// routes/user.js (recommended structure)
const express = require('express');
const router = express.Router();
const { isLoggedIn, isUser } = require('../middleware/auth');

router.get('/home', isLoggedIn, isUser, (req, res) => {
  res.render('user/home'); // renders views/user/home.ejs
});

module.exports = router;
