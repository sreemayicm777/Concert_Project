const User = require('../models/User');

// Show signup form
exports.getSignup = (req, res) => {
  res.render('auth/signup', { error: null });
};

// Handle signup (now redirects to login)
exports.postSignup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // already registered email getting 
    // const existingUser = await User.findOne({ email });
    // if (existingUser) {
    //   // 400 error for already registered email
    //   res.status(400).json({ error: 'Email already registered' });
    // }
    const user = new User({ username, email, password });
    await user.save();
    
    // Redirect to login page with success message instead of auto-login
    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/login');
  } catch (err) {
    res.render('auth/signup', { error: err.message });
  }
};

// Show login form

exports.getLogin = (req, res) => {
  res.render('auth/login', {error: null });
};

// Handle login (unchanged)
exports.postLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.render('auth/login', { error: 'Invalid credentials' });
    }
    
    req.session.user = user;
    res.redirect('/concerts');
  } catch (err) {
    res.render('auth/login', { error: err.message });
  }
};

// Handle logout (unchanged)
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};