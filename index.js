require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Ensure Supabase credentials exist
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error("❌ Supabase credentials are missing in .env file!");
  process.exit(1);
}

// ✅ Initialize Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// ✅ Middleware
app.use(express.json()); // Parses incoming JSON request bodies

/**
 * ✅ CORS Middleware - Fixes cross-origin issues
 * CORS (Cross-Origin Resource Sharing) allows requests from different domains.
 * 
 * - `origin: "*"`, allows **ALL** domains (Not recommended for production).
 * - `methods`, defines allowed HTTP methods.
 * - `allowedHeaders`, defines what headers the frontend can send.
 */
const corsOptions = {
  origin: "*", // Change this to the frontend URL in production (e.g., "https://your-frontend.com")
  methods: "GET, POST, PUT, DELETE, OPTIONS", // Allowed request types
  allowedHeaders: "Content-Type, Authorization", // Allowed headers in requests
};
app.use(cors(corsOptions));

// ✅ Test Supabase Connection
// async function testConnection() {
//   const { data, error } = await supabase.from("users").select("*").limit(1);
//   if (error) {
//     console.error("❌ Supabase connection error:", error.message);
//   } else {
//     console.log("✅ Supabase connected! Sample data:", data);
//   }
// }
// testConnection();

async function testSupabase() {
  const { data, error } = await supabase.from("users").select("*").limit(1);
  console.log("Supabase Data:", data);
  console.log("Supabase Error:", error);
}
testSupabase();


// ✅ Home Route - Just for checking if the server is running
// app.get("/", (req, res) => {
//   res.send("🚀 Supabase Auth API is Running!");
// });

app.get("/debug-env", (req, res) => {
  res.json({
    SUPABASE_URL: process.env.SUPABASE_URL || "❌ Not Set",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "✅ Set" : "❌ Not Set"
  });
});
app.get("/", (req, res) => {
   
  return res.json({
      success: true,
      message: 'Your server is up and running....'
  });
});


// ✅ User Registration
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 🚨 Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Username, Email, and Password are required" });
    }

    // ✅ Insert new user with `islogin: false` (default)
    const { data, error } = await supabase
      .from("users")
      .insert([{ username, email, password, islogin: false }])
      .select("*") // ✅ Fetch inserted data immediately
      if (error) return res.status(400).json({ error: error.message });

      res.json({
        message: "✅ User registered successfully!",
        //user: data[0] // ✅ Send back full user object
        // because "value for message cannot be cast from readable Native Map to String"
        user: data?.[0] || null, // Ensure valid structure
      });
    } catch (error) {
      console.error("Register Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ User Login
// app.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // 🚨 Validate input fields
//     if (!email || !password) {
//       return res.status(400).json({ error: "Email and password are required" });
//     }

//     // ✅ Fetch user by email
//     const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single();
//     if (error || !user) return res.status(400).json({ message: "Invalid credentials" });

//     // 🚨 Check if password is correct (No hashing used)
//     if (user.password !== password) return res.status(400).json({ message: "Invalid credentials" });

//     // ✅ Update islogin to true when login is successful
//     await supabase.from("users").update({ islogin: true }).eq("email", email);

//     res.json({ message: "✅ Login successful!", user});
//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// updated login code 
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🚨 Validate input fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // ✅ Fetch user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    // 🔥 Fix: Properly check if user exists before checking password
    if (error || !user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 🚨 Check if password matches (Add hashing in production)
    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // ✅ Update islogin to true when login is successful
    await supabase.from("users").update({ islogin: true }).eq("email", email);

    res.json({
      message: "✅ Login successful!",
      user
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// ✅ User Logout
app.post("/logout", async (req, res) => {
  try {
    const { email } = req.body;

    // 🚨 Ensure email is provided
    if (!email) return res.status(400).json({ error: "Email is required" });

    // ✅ Update islogin to false on logout
    await supabase.from("users").update({ islogin: false }).eq("email", email);

    res.json({ message: "✅ Logout successful!" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Start the server (for local testing)
// app.listen(PORT, () => {
//   console.log(`🚀 Server started on http://localhost:${PORT}`);
// });

//With this (for local + Vercel support)
//Vercel doesn't use app.listen(), it requires module.exports = app;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
  });
}

module.exports = app; // ✅ Required for Vercel
