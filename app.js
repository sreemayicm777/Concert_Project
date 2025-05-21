require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const ejsLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const path = require('path');
const fs = require('fs');


// Import routes
const concertRoutes = require('./routes/concertRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');


// Import models for admin initialization
const User = require('./models/User');

const app = express();

// Database connection
require('./config/db');
const connectDB = require('./config/db');
connectDB();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Session configuration with MongoDB storage
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.DB_URI,
    collectionName: 'sessions'
  }),
  cookie: { 
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Flash messages middleware
app.use(flash());

// Middleware
app.use(express.static(path.join(__dirname, 'public'))); // Fixed static files path
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(ejsLayouts);

// Make user and flash messages available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layouts/layout');

// Routes
app.use('/concerts', concertRoutes);
app.use('/bookings', bookingRoutes);
app.use('/', authRoutes);

// Home route
app.get('/', (req, res) => {
  if (req.session.user) {
    // Redirect to appropriate dashboard based on role
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    return res.redirect('/concerts');
  }
  res.redirect('/login');
});

// Create admin user on startup
User.initAdmin();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'CastError') {
    req.flash('error', 'Invalid ID format');
    return res.redirect('/concerts');
  }
  app.get('/user/home', (req, res) => {
  res.render('user/home');
});
  res.status(500).render('error', {
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    message: 'Page not found',
    error: 'The requested page could not be found' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});