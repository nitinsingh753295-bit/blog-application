const API = "/api";

// ================================
// USER HELPERS
// ================================


function requireLogin() {
  const token = localStorage.getItem("blogToken");

  if (!token) {
    window.location.replace("login.html");
    return false;
  }

  return true;
}

async function verifyLogin() {
  const token = localStorage.getItem("blogToken");

  if (!token) {
    window.location.replace("login.html");
    return false;
  }

  try {
    const response = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      localStorage.removeItem("blogToken");
      localStorage.removeItem("blogUser");
      window.location.replace("login.html");
      return false;
    }

    const result = await response.json();
    localStorage.setItem("blogUser", JSON.stringify(result.user));
    return true;
  } catch {
    alert("Could not verify your session. Please try again.");
    return false;
  }
}


function getUser() {
    try {
        return JSON.parse(localStorage.getItem("blogUser") || "null");
    } catch {
        return null;
    }
}

function getSavedUser() {
    try {
        return JSON.parse(localStorage.getItem("blogUser") || "null");
    } catch {
        return null;
    }
}

function getUserId(user) {
    return String(user?._id || user?.id || "");
}

function getBlogAuthorId(blog) {
    const author = blog.author;

    return String(
        typeof author === "object" && author
            ? author._id || author.id || ""
            : author || ""
    );
}

function getToken() {
    return localStorage.getItem("blogToken");
}

function showMessage(message) {
    alert(message);
}

// ================================
// REGISTER
// ================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirm = document.getElementById("confirmPassword").value;

        if (password !== confirm) {
            return showMessage("Passwords do not match.");
        }

        try {
            const response = await fetch(`${API}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed.");
            }

            showMessage("Registration successful! Please log in.");
            window.location.href = "login.html";
        } catch (error) {
            showMessage(
                error.message || "Unable to connect to server."
            );
        }
    });
}

// ================================
// LOGIN
// ================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {
            const response = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed.");
            }

            localStorage.setItem("blogToken", data.token);
            localStorage.setItem("blogUser", JSON.stringify(data.user));

            window.location.href = "dashboard.html";
        } catch (error) {
            showMessage(
                error.message || "Unable to connect to server."
            );
        }
    });
}

// ================================
// CREATE BLOG
// ================================


const blogForm = document.getElementById("blogForm");

if (blogForm) {
  const editingId = new URLSearchParams(location.search).get("id");

  const titleInput = document.getElementById("blogTitle");
  const categoryInput = document.getElementById("blogCategory");
  const imageInput = document.getElementById("blogImage");
  const contentInput = document.getElementById("blogContent");

  async function loadBlogForEditing() {
    if (!editingId) return;

    const token = localStorage.getItem("blogToken");
    if (!token) {
      location.href = "login.html";
      return;
    }

    try {
      const response = await fetch(
        `/api/blogs/${encodeURIComponent(editingId)}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not load blog.");
      }

      const blog = result.blog || result;
      const user = getSavedUser();

      if (!user || getUserId(user) !== getBlogAuthorId(blog)) {
        alert("You can only edit your own blogs.");
        location.href = "index.html";
        return;
      }

      titleInput.value = blog.title || "";
      categoryInput.value = blog.category || "";
      imageInput.value = blog.image || "";
      contentInput.value = blog.content || "";
    } catch (error) {
      alert(error.message);
    }
  }

  blogForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("blogToken");
    if (!token) {
      location.href = "login.html";
      return;
    }

    const blogData = {
      title: titleInput.value.trim(),
      category: categoryInput.value.trim(),
      image: imageInput.value.trim(),
      content: contentInput.value.trim()
    };

    try {
      const response = await fetch(
        editingId
          ? `/api/blogs/${encodeURIComponent(editingId)}`
          : "/api/blogs",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(blogData)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not save blog.");
      }

      const blog = result.blog || result;

      location.href = blog._id
        ? `blog-details.html?id=${encodeURIComponent(blog._id)}`
        : "index.html";
    } catch (error) {
      alert(error.message || "Could not save blog.");
    }
  });

  loadBlogForEditing();
}

// ================================
// BLOG CARD
// ================================

function createBlogCard(blog) {
    const card = document.createElement("article");
    card.className = "blog-card";

    // Blog image
    if (blog.image) {
        try {
            const url = new URL(blog.image, window.location.origin);

            if (["https:", "http:"].includes(url.protocol)) {
                const image = document.createElement("img");
                image.src = url.href;
                image.alt = blog.title || "Blog image";
                image.loading = "lazy";
                image.style.cssText =
                    "width:100%;height:190px;object-fit:cover";

                card.appendChild(image);
            }
        } catch {
            // Ignore invalid image URLs.
        }
    }

    const body = document.createElement("div");
    body.className = "blog-card-body";

    const category = document.createElement("p");
    category.className = "category";
    category.textContent = blog.category || "General";

    const title = document.createElement("h3");
    title.textContent = blog.title || "Untitled";

    const author = document.createElement("p");
    author.className = "blog-meta";
    author.textContent =
        "By " + (blog.author?.name || "Unknown author");

    const content = blog.content || "";

    const excerpt = document.createElement("p");
    excerpt.textContent =
        content.length > 140
            ? content.slice(0, 140) + "..."
            : content;

    const readLink = document.createElement("a");
    readLink.href =
        "blog-details.html?id=" + encodeURIComponent(blog._id);
    readLink.textContent = "Read More";
    readLink.className = "btn btn-outline";
    readLink.style.marginTop = "16px";

    body.append(category, title, author, excerpt, readLink);

    // Show edit and delete controls only for the blog owner.
    const user = getSavedUser();

    const isOwner =
        user && getUserId(user) === getBlogAuthorId(blog);

    if (isOwner) {
        const editLink = document.createElement("a");
        editLink.href =
            "create-blog.html?id=" + encodeURIComponent(blog._id);
        editLink.textContent = "Edit";
        editLink.className = "btn-edit";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "btn-delete";

        deleteButton.addEventListener("click", async () => {
            if (!confirm("Are you sure you want to delete this blog?")) {
                return;
            }

            try {
                const token = getToken();

                if (!token) {
                    throw new Error("Please log in to delete this blog.");
                }

                const response = await fetch(
                    `${API}/blogs/${encodeURIComponent(blog._id)}`,
                    {
                        method: "DELETE",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        localStorage.removeItem("blogToken");
                        localStorage.removeItem("blogUser");
                    }

                    throw new Error(
                        result.message || "Delete failed."
                    );
                }

                await loadBlogs();
                showMessage("Blog deleted successfully.");
            } catch (error) {
                showMessage(
                    error.message || "Could not delete blog."
                );
            }
        });

        body.append(editLink, deleteButton);
    }

    card.appendChild(body);

    return card;
    
async function loadDashboard() {
  const grid = document.getElementById("myBlogsGrid");
  if (!grid) return;

  const message = document.getElementById("myBlogsMessage");

  const authenticated = await verifyLogin();
  if (!authenticated) return;

  const token = localStorage.getItem("blogToken");

  try {
    // Load the current user's profile
    const profileResponse = await fetch("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!profileResponse.ok) {
      throw new Error("Could not load your profile.");
    }

    const profileResult = await profileResponse.json();
    const user = profileResult.user;

    document.getElementById("profileName").textContent = user.name;
    document.getElementById("profileEmail").textContent = user.email;

    // Load only the logged-in user's blogs
    const blogsResponse = await fetch("/api/my-blogs", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const blogsResult = await blogsResponse.json();

    if (!blogsResponse.ok) {
      throw new Error(
        blogsResult.message || "Could not load your blogs."
      );
    }

    const blogs = blogsResult.blogs || [];
    grid.replaceChildren();

    if (blogs.length === 0) {
      message.textContent =
        "You haven't published any blogs yet.";
      return;
    }

    message.textContent = "";

    blogs.forEach((blog) => {
      grid.appendChild(createBlogCard(blog));
    });
  } catch (error) {
    message.textContent =
      error.message || "Something went wrong.";
  }
}

// Logout: remove the local JWT and user data
function logout() {
  localStorage.removeItem("blogToken");
  localStorage.removeItem("blogUser");
  window.location.replace("login.html");
}

// Attach the logout action
document.getElementById("logoutBtn")?.addEventListener(
  "click",
  logout
);

// Initialize only on the dashboard page
if (document.getElementById("myBlogsGrid")) {
  loadDashboard();
}

}

// ================================
// SEARCH AND CATEGORY FILTER
// ================================

let allBlogs = [];

function renderBlogs() {
    const grid = document.getElementById("blogGrid");

    if (!grid) return;

    const searchTerm =
        document.getElementById("searchInput")
            ?.value.trim().toLowerCase() || "";

    const selectedCategory =
        document.getElementById("categoryFilter")?.value || "";

    const filteredBlogs = allBlogs.filter((blog) => {
        const text =
            `${blog.title || ""} ${blog.content || ""}`.toLowerCase();

        return (
            text.includes(searchTerm) &&
            (!selectedCategory || blog.category === selectedCategory)
        );
    });

    grid.replaceChildren();

    if (filteredBlogs.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No blogs found.";
        grid.appendChild(message);
        return;
    }

    filteredBlogs.forEach((blog) => {
        grid.appendChild(createBlogCard(blog));
    });
}

// ================================
// LOAD ALL BLOGS
// ================================

async function loadBlogs() {
    const grid = document.getElementById("blogGrid");

    if (!grid) return;

    try {
        const response = await fetch(`${API}/blogs`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Could not load blogs."
            );
        }

        allBlogs = Array.isArray(result)
            ? result
            : Array.isArray(result.blogs)
                ? result.blogs
                : [];

        // Populate category filter.
        const filter = document.getElementById("categoryFilter");

        if (filter) {
            const previous = filter.value;

            const categories = [
                ...new Set(
                    allBlogs
                        .map((blog) => blog.category)
                        .filter(Boolean)
                )
            ].sort();

            filter.replaceChildren();

            const allOption = document.createElement("option");
            allOption.value = "";
            allOption.textContent = "All Categories";
            filter.appendChild(allOption);

            categories.forEach((category) => {
                const option = document.createElement("option");
                option.value = category;
                option.textContent = category;
                filter.appendChild(option);
            });

            filter.value = categories.includes(previous)
                ? previous
                : "";
        }

        renderBlogs();
    } catch (error) {
        grid.textContent =
            error.message || "Unable to load blogs. Please try again.";

        console.error(error);
    }
}

// Search listener
document.getElementById("searchInput")?.addEventListener(
    "input",
    renderBlogs
);

// Category filter listener
document.getElementById("categoryFilter")?.addEventListener(
    "change",
    renderBlogs
);

// ================================
// INDIVIDUAL BLOG DETAILS
// ================================

async function loadBlogDetails() {
    const container = document.getElementById("blogDetails");

    if (!container) return;

    const id = new URLSearchParams(window.location.search).get("id");

    if (!id) {
        container.textContent = "No blog was selected.";
        return;
    }

    try {
        const response = await fetch(
            `${API}/blogs/${encodeURIComponent(id)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to load this blog."
            );
        }

        const blog = data.blog || data;

        if (!blog) {
            throw new Error("Blog not found.");
        }

        container.replaceChildren();

        const category = document.createElement("span");
        category.className = "category";
        category.textContent = blog.category || "General";

        const title = document.createElement("h1");
        title.textContent = blog.title || "Untitled";

        const meta = document.createElement("p");
        meta.className = "blog-meta";
        meta.textContent =
            `By ${blog.author?.name || "Unknown author"} · ` +
            (
                blog.createdAt
                    ? new Date(blog.createdAt).toLocaleDateString()
                    : ""
            );

        container.append(category, title, meta);

        if (blog.image) {
            try {
                const url = new URL(blog.image, window.location.origin);

                if (["https:", "http:"].includes(url.protocol)) {
                    const image = document.createElement("img");
                    image.src = url.href;
                    image.alt = blog.title || "Blog image";
                    image.className = "detail-image";
                    container.appendChild(image);
                }
            } catch {
                // Skip invalid image URLs.
            }
        }

        const body = document.createElement("div");
        body.className = "blog-body";
        body.style.whiteSpace = "pre-wrap";
        body.textContent = blog.content || "";

        container.appendChild(body);
    } catch (error) {
        container.textContent =
            error.message || "Unable to load this blog.";

        console.error(error);
    }
}

// ================================
// CHARACTER COUNT
// ================================

const blogContent = document.getElementById("blogContent");
const characterCount = document.getElementById("characterCount");

if (blogContent && characterCount) {
    characterCount.textContent = blogContent.value.length;

    blogContent.addEventListener("input", () => {
        characterCount.textContent = blogContent.value.length;
    });
}

// ================================
// INITIALIZE PAGE
// ================================

loadBlogs();
loadBlogDetails();