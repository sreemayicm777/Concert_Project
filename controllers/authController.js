const User = require('../models/User');

// Show signup form
exports.getSignup = (req, res) => {
  res.render('auth/signup', { error: null });
};

// Handle signup
exports.postSignup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    
    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/login');
  } catch (err) {
    res.render('auth/signup', { error: err.message });
  }
};

// Show login form
exports.getLogin = (req, res) => {
  res.render('auth/login', { error: null });
};

// Handle login with role-based redirection
exports.postLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.render('auth/login', { error: 'Invalid credentials' });
    }

    // Save user in session
    req.session.user = user;
    
    // Role-based redirection
    if (user.role === 'admin') {
      return res.redirect('/concerts');
    } else {
      return res.redirect('/bookings');
    }
    
  } catch (err) {
    res.render('auth/login', { error: err.message });
  }
};

// Handle logout
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};