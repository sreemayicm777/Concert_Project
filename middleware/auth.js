// middleware/auth.js
exports.isLoggedIn = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect('/login');
};

exports.isAdmin = (req, res, next) => {
  if (req.session.user?.role === 'admin') return next();
  res.status(403).send('Admin access required');
};

exports.isUser = (req, res, next) => {
  if (req.session.user?.role === 'user') return next();
  res.status(403).send('User access required');
};