require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
const { createClient } = require('@supabase/supabase-js')
var Sequelize = require('sequelize');
const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;

process.sequelize = new Sequelize(
  "database",
  process.env.USER,
  process.env.PASSWORD,
  {
    host: "0.0.0.0",
    dialect: "sqlite",
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    storage: "./db/njtd.db"
  }
)

// const Download = require('./models/Download.supabase');
// Download.uploadFromJson(require('./db/downloads.json')[0])
process.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY)

var indexRouter = require('./routes/index');
var downloadsRouter = require('./routes/downloads.supabase');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/downloads', downloadsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
