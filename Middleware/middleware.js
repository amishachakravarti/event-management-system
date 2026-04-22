module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  next();
};

module.exports.isVendor = (req, res, next) => {
  if (req.user.role === "vendor") {
    return next();
  }
  return res.send("Access Denied ❌");
};

module.exports.isUser = (req, res, next) => {
  if (req.user.role === "user") {
    return next();
  }
  return res.send("Access Denied ❌");
};