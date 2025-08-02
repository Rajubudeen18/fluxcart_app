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

  // Check if admin already exists
  const adminExists = await User.findOne({ email: "admin@example.com" });

  if (!adminExists) {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const adminUser = new User({
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin", // Important
    });

    await adminUser.save();
    console.log("✅ Admin user seeded!");
  } else {
    console.log("⚠️ Admin already exists.");
  }

  process.exit();
})
.catch((err) => {
  console.error(err);
  process.exit(1);
});
