const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  name: String,
  email: String,
  address: String,

  status: {
    type: String,
    enum: ["Received", "Ready for Shipping", "Out For Delivery"],
    default: "Pending"
  },

  // 🔥 NEW: cart items store
  items: [
    {
      name: String,
      price: Number,
      quantity: Number
    }
  ]
});

module.exports = mongoose.model("Order", orderSchema);