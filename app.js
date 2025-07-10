if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config(); // Load env variables in development
}

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');
const MongoStore = require('connect-mongo')(session);

const app = express();

// ============== Environment ==============
app.set('env', process.env.NODE_ENV || 'development');

// ============== Middleware ==============
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression()); // Enable gzip compression

// ============== Static Files ==============
app.use(express.static(path.join(__dirname, '../public')));

// ============== View Engine ==============
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// ============== MongoDB Connection ==============
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(' MongoDB connection error:', err));

// ============== Session Config ==============
app.use(session({
  secret: process.env.SESSION_SECRET || 'secretKey',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// ============== Flash Messages ==============
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// ============== Passport Config ==============
require('../middleware/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// ============== Global Template Vars ==============
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

// ============== Routes ==============
app.use('/', require('../routes/index'));
app.use('/complaints', require('../routes/complaint')); //  fixed: use singular if file is complaint.js
app.use('/feedback', require('../routes/feedback'));
app.use('/users', require('../routes/users'));
app.use('/admin', require('../routes/admin'));
app.use('/staff', require('../routes/staff'));
app.use('/captcha', require('../routes/captcha'));

// ============== 404 Fallback ==============
app.use((req, res) => {
  res.status(404).render('pages/404'); //  make sure views/pages/404.ejs exists
});

// ============== Server Start ==============
const hostname = 'localhost';
const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(` Server running at http://${hostname}:${port}/`);
});

