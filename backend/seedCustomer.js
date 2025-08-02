const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: './backend/.env' });
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log("MongoDB connected");

  // Check if customer already exists
  const customerExists = await User.findOne({ email: "customer@example.com" });

  if (!customerExists) {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("customer123", 10);

    const customerUser = new User({
      firstName: "Customer",
      lastName: "User",
      email: "customer@example.com",
      password: hashedPassword,
      role: "customer", // Important
    });

    await customerUser.save();
    console.log("✅ Customer user seeded!");
  } else {
    console.log("⚠️ Customer already exists.");
  }

  process.exit();
})
.catch((err) => {
  console.error(err);
  process.exit(1);
});
