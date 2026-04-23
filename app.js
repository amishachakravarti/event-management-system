const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const User = require("./models/User");
const userRoutes = require("./routes/User");

require("dotenv").config();

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// DB
mongoose.connect("mongodb://127.0.0.1:27017/eventDB")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// session
app.use(session({
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: false
}));

// passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// current user (optional)
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// routes
app.use("/", userRoutes);

// home
app.get("/", (req, res) => {
  res.render("index");
});

// server
app.listen(8000, () => {
  console.log("Server running on port 8000");
});