const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// setting for the view engine
app.set('view engine', 'pug');
// create a path joining the directory name and /views
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARES
/*
app.use - accepts a function (not a function call) as an argument to use as a middleware.
However, a function call will then return a function that's gonna sit there until it's called.
*/

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers (should be at the top middleware)
// app.use(helmet());

// Development logging
console.log(`environment: ${process.env.NODE_ENV}`);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit request from same IP address
// rate-limiting - prevents brute force and denial of service attacks
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1hr
  message: 'Too many requests from this IP. Please try again in an hour.',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // dont accept a body that is larger than 10kb

// to parse coming from url encoded form (form inputs)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parse data from cookies to req.cookies
app.use(cookieParser());

// DATA SANITIZATION - clean all the data that comes into the application from malicious code (use after body parser)
// Data sanitization against NoSQL query injection
// Filters out all dollar signs and dots at the req body, req query string, and req params
app.use(mongoSanitize());

// Data sanitization against XSS
// clean user input from malicious HTML/JS code
app.use(xss());

// Prevent parameter pollution / duplicate query strings
app.use(
  hpp({
    // allow duplicates
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(`request header: ${JSON.stringify(req.headers)}`);
  console.log('req cookies', req.cookies);
  next();
});

// API routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // throw an error to next which skips all middlewares
  // and proceeds to the global error handler middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
