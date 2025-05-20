// middleware/auth.js

// Main authentication check
exports.isLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) {
    // Attach user to request object for consistency
    req.user = req.session.user;
    return next();
  }
  res.redirect('/login');
};

// Admin role check
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Admin access required');
  res.redirect('/');
};

// User role check
exports.isUser = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    return next();
  }
  req.flash('error', 'User access required');
  res.redirect('/');
};