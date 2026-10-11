
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");

const User = require("./models/User");
const Blog = require("./models/Blog");

const app = express();

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!process.env.MONGODB_URI || !JWT_SECRET) {
    throw new Error("Set MONGODB_URI and JWT_SECRET in .env");
}

// Create a login token
function createToken(user) {
    return jwt.sign(
        { id: user._id.toString() },
        JWT_SECRET,
        { expiresIn: "2h" }
    );
}

// Protect endpoints that require login
async function authenticate(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            message: "Please log in first."
        });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(payload.id);

        if (!user) {
            return res.status(401).json({
                message: "User account not found."
            });
        }

        req.user = user;
        next();
    } catch {
        return res.status(401).json({
            message: "Invalid or expired login token."
        });
    }
}

// API status
app.get("/api", (req, res) => {
    res.json({ message: "BlogSpace API is running." });
});

// REGISTER
app.post("/api/auth/register", async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: "Enter a valid email address."
            });
        }

        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({
                message: "Password must contain 8–72 characters."
            });
        }

        const existing = await User.findOne({ email });

        if (existing) {
            return res.status(409).json({
                message: "Email is already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Account created successfully.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email is already registered."
            });
        }

        console.error(error);
        res.status(500).json({ message: "Unable to register." });
    }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        const user = await User.findOne({ email }).select("+password");

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = createToken(user);

        res.json({
            message: "Login successful.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to log in." });
    }
});

// GET ALL BLOGS — newest first
app.get("/api/blogs", async (req, res) => {
    try {
        const blogs = await Blog.find()
            .populate("author", "name")
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, blogs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to load blogs." });
    }
});

// GET ONE BLOG BY ID
app.get("/api/blogs/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid blog ID." });
        }

        const blog = await Blog.findById(req.params.id)
            .populate("author", "name")
            .lean();

        if (!blog) {
            return res.status(404).json({ message: "Blog not found." });
        }

        res.json({ success: true, blog });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to load blog." });
    }
});

// CREATE BLOG — logged-in users only
app.post("/api/blogs", authenticate, async (req, res) => {
    try {
        const title = String(req.body.title || "").trim();
        const category = String(req.body.category || "").trim();
        const content = String(req.body.content || "").trim();
        const image = String(req.body.image || "").trim();

        if (!title || !category || !content) {
            return res.status(400).json({
                message: "Title, category and content are required."
            });
        }

        if (title.length > 180 || content.length > 50000) {
            return res.status(400).json({
                message: "Title or content is too long."
            });
        }

        if (image && !/^https?:\/\/\S+$/i.test(image)) {
            return res.status(400).json({
                message: "Cover image must be a valid HTTP(S) URL."
            });
        }

        const blog = await Blog.create({
            title,
            category,
            content,
            image,
            author: req.user._id
        });

        const result = await blog.populate("author", "name");

        res.status(201).json({
            success: true,
            message: "Blog published successfully.",
            blog: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to create blog." });
    }
});

// Start only after MongoDB connects
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB.");

        app.listen(PORT, () => {
            console.log(`BlogSpace: http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });


const mongoose = require("mongoose");
const Blog = require("./models/Blog");

// UPDATE a blog — only its author can edit it
app.put("/api/blogs/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, content, image } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid blog ID." });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found." });
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only edit your own blogs."
      });
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        message: "Title, category and content are required."
      });
    }

    if (image && !/^https?:\/\/\S+$/i.test(image)) {
      return res.status(400).json({
        message: "Please provide a valid image URL."
      });
    }

    blog.title = title.trim();
    blog.category = category.trim();
    blog.content = content.trim();
    blog.image = image?.trim() || "";

    await blog.save();

    const updatedBlog = await Blog.findById(blog._id)
      .populate("author", "name");

    res.json({
      message: "Blog updated successfully.",
      blog: updatedBlog
    });
  } catch (error) {
    console.error("Update blog error:", error);
    res.status(500).json({ message: "Could not update blog." });
  }
});

// DELETE a blog — only its author can delete it
app.delete("/api/blogs/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid blog ID." });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found." });
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only delete your own blogs."
      });
    }

    await blog.deleteOne();

    res.json({ message: "Blog deleted successfully." });
  } catch (error) {
    console.error("Delete blog error:", error);
    res.status(500).json({ message: "Could not delete blog." });
  }
});
