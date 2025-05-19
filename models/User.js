const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Create admin user if not exists
userSchema.statics.initAdmin = async function () {
  const adminExists = await this.findOne({ username: "admin" });
  if (!adminExists) {
    await this.create({
      username: "admin",
      email: "admin@concerts.com",
      password: "admin123", // Change this in production!
      role: "admin",
    });
    console.log("Admin user created");
  }
};

module.exports = mongoose.model("User", userSchema);
