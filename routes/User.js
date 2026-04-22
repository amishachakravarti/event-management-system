const express = require("express");
const router = express.Router();

const passport = require("passport");
const User = require("../models/User");
const { isLoggedIn, isVendor, isUser } = require("../Middleware/middleware");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");

/*
   REGISTER
*/
router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role, category } = req.body;

    const newUser = new User({ username, email, role, category });

    const registeredUser = await User.register(newUser, password);

    //  auto login
    req.login(registeredUser, (err) => {
      if (err) return res.redirect("/login");

      if (registeredUser.role === "vendor") {
        return res.redirect("/vendor");
      } else if (registeredUser.role === "admin") {
        return res.redirect("/admin");
      } else {
        return res.redirect("/user");
      }
    });

  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
});

/* 
   LOGIN */
router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", (req, res, next) => {

  passport.authenticate("local", (err, user, info) => {

    console.log("BODY:", req.body); // debug

    if (err) {
      console.log(err);
      return next(err);
    }

    if (!user) {
      console.log("Login Failed:", info);
      return res.send("Invalid username or password ");
    }

    req.login(user, (err) => {
      if (err) return next(err);

      console.log("Login Success:", user);

      if (user.role === "vendor") {
        return res.redirect("/vendor");
      } else if (user.role === "admin") {
        return res.redirect("/admin");
      } else {
        return res.redirect("/user");
      }
    });

  })(req, res, next);

});
/* 
   DASHBOARDS
 */

router.get("/vendor", isLoggedIn, isVendor, (req, res) => {
  res.render("vendor", { currentUser: req.user });
});

router.get("/user", isLoggedIn, isUser, (req, res) => {
  res.render("user", { currentUser: req.user });
});

/* 
   LOGOUT
 */
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/login");
  });
});

router.get("/vendor/add", async (req, res) => {
  const products = await Product.find({ owner: req.user._id });

  res.render("add", { 
    currentUser: req.user,
    products: products   
  });
});

router.post("/vendor/add", async (req, res) => {
  const { name, price, image } = req.body;

  await Product.create({
    name,
    price,
    image,
    owner: req.user._id
  });

  res.redirect("/vendor/items");
});

router.get("/vendor/items", async (req, res) => {
  const products = await Product.find({ owner: req.user._id });

  res.render("items", {
    currentUser: req.user,
    products
  });
});

router.post("/vendor/delete/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect("/vendor/add");
});
router.get("/vendors", async (req, res) => {

  const vendors = await User.find({ role: "vendor" });

  res.render("vendors", { vendors });

});
router.get("/vendors/:id", async (req, res) => {

  const vendor = await User.findById(req.params.id);
  const products = await Product.find({ owner: req.params.id });

  res.render("product", { vendor, products });

});


router.post("/cart/add/:id",isLoggedIn, async (req, res) => {

    console.log("USER:", req.user); //  debug
  const productId = req.params.id;

  let existing = await Cart.findOne({
    user: req.user._id,
    product: productId
  });

  if (existing) {
    existing.quantity += 1;
    await existing.save();
  } else {
    await Cart.create({
      user: req.user._id,
      product: productId,
      quantity: 1
    });
  }

  res.redirect("/cart");
});
router.get("/cart", async (req, res) => {

  const cartItems = await Cart.find({ user: req.user._id })
    .populate("product");

  res.render("cart", { cartItems });
});
router.post("/cart/remove/:id", async (req, res) => {
  await Cart.findByIdAndDelete(req.params.id);
  res.redirect("/cart");
});
router.get("/checkout", isLoggedIn, (req, res) => {
  res.render("checkout");
});
router.post("/checkout", isLoggedIn, async (req, res) => {

  console.log("REQ.USER:", req.user);   
  console.log("BODY:", req.body);       

  const { name, email, address } = req.body;

  await Order.create({
    user: req.user._id,
    name,
    email,
    address,
    status: "Pending"
  });

  await Cart.deleteMany({ user: req.user._id });

  res.redirect("/orders");
});

router.post("/checkout", isLoggedIn, async (req, res) => {

  const { name, email, address } = req.body;

  //  cart fetch karo
  const cartItems = await Cart.find({ user: req.user._id }).populate("product");

  //  items array banao
  const items = cartItems.map(item => ({
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity
  }));

  //  order save with items
  await Order.create({
    user: req.user._id,
    name,
    email,
    address,
    items,
    status: "Pending"
  });

  //  cart clear
  await Cart.deleteMany({ user: req.user._id });

  res.redirect("/orders");
});
router.get("/orders", isLoggedIn, async (req, res) => {

  const orders = await Order.find({ user: req.user._id });

  res.render("orders", { orders });

});

router.get("/admin", isLoggedIn, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.send("Access Denied ");
  }

  res.render("admin");
});

router.get("/admin/users", isLoggedIn, async(req, res) => {

  if (req.user.role !== "admin") {
    return res.send("Access Denied ");
  }
const users = await User.find();
  res.render("adminUsers",{users});
});
router.get("/admin/vendors", isLoggedIn, (req, res) => {

  if (req.user.role !== "admin") {
    return res.send("Access Denied ");
  }

  res.render("adminUsers");
});
router.post("/admin/user/delete/:id", isLoggedIn, async (req, res) => {

  if (req.user.role !== "admin") {
    return res.send("Access Denied");
  }

  await User.findByIdAndDelete(req.params.id);

  res.redirect("/admin/users");
});
router.post("/admin/user/update/:id", isLoggedIn, async (req, res) => {

  if (req.user.role !== "admin") {
    return res.send("Access Denied");
  }

  const { role } = req.body;

  await User.findByIdAndUpdate(req.params.id, { role });

  res.redirect("/admin/users");
});

router.get("/admin/orders", isLoggedIn, async (req, res) => {
  if (req.user.role !== "admin") return res.send("Access Denied");

  const orders = await Order.find();

  res.render("adminOrders", { orders });
});
router.post("/admin/order/update/:id", async (req, res) => {
  const { status } = req.body;

  await Order.findByIdAndUpdate(req.params.id, { status });

  res.redirect("/admin/orders");
});

router.post("/orders/update/:id", async (req, res) => {
  try {
    const { status } = req.body;

    await Order.findByIdAndUpdate(req.params.id, { status });

    res.redirect("/admin/orders");
  } catch (err) {
    console.log(err);
    res.send("Error updating status");
  }
});

router.get("/vendor/products", isLoggedIn, async (req, res) => {

  if (req.user.role !== "vendor") {
    return res.send("Access Denied ");
  }

  const products = await Product.find({ owner: req.user._id });

  res.render("vendorProducts", { products });
});
router.post("/vendor/products/delete/:id", isLoggedIn, async (req, res) => {

  await Product.findByIdAndDelete(req.params.id);

  res.redirect("/vendor/products");
});
router.post("/vendor/products/update/:id", isLoggedIn, async (req, res) => {

  await Product.findByIdAndUpdate(req.params.id, {
    status: "Updated"
  });

  res.redirect("/vendor/products");
});

router.get("/vendor/order/update/:id", isLoggedIn, async (req, res) => {

  if (req.user.role !== "vendor") {
    return res.send("Access Denied");
  }

  const order = await Order.findById(req.params.id);

  res.render("updateStatus", { order });
});
router.post("/vendor/order/update/:id", isLoggedIn, async (req, res) => {

  const { status } = req.body;

  await Order.findByIdAndUpdate(req.params.id, { status });

  res.redirect("/vendor/transactions");
});
module.exports = router;