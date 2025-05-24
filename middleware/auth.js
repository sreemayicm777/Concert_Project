// middleware/auth.js

// Main authentication check
exports.isLoggedIn = (req, res, next) => {
  if (req.session?.user) {  // Optional chaining for cleaner syntax
    // Attach user to request object for consistency
    req.user = req.session.user;
    return next();
  }
  
  // Store the original URL for redirect after login
  req.session.returnTo = req.originalUrl;
  req.flash('error', 'You must be logged in to access this page');
  return res.redirect('/login');
};

// Admin role check
exports.isAdmin = (req, res, next) => {
  // First ensure user is logged in
  if (!req.user) {
    req.flash('error', 'You must be logged in first');
    return res.redirect('/login');
  }

  if (req.user.role === 'admin') {
    return next();
  }

  req.flash('error', 'Administrator privileges required');
  return res.redirect('/');
};

// User role check
exports.isUser = (req, res, next) => {
  // First ensure user is logged in
  if (!req.user) {
    req.flash('error', 'You must be logged in first');
    return res.redirect('/login');
  }

  if (req.user.role === 'user') {
    return next();
  }

  req.flash('error', 'User account required');
  return res.redirect('/');
};

// Optional: Combined role check middleware
exports.hasRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      req.flash('error', 'Authentication required');
      return res.redirect('/login');
    }

    if (req.user.role === role) {
      return next();
    }

    req.flash('error', `Insufficient privileges (${role} role required)`);
    return res.redirect('/');
  };
};