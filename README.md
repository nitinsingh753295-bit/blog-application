# BlogSpace — Full-Stack Blog Application

BlogSpace is a responsive blogging application where users can register, sign in, publish stories, browse posts, search by title or content, filter by category, and manage their own blogs.

## Features

- **Authentication:** Registration and login with bcrypt password hashing and expiring JWTs.
- **Blog CRUD:** Create, read, update, and delete blog posts.
- **Ownership checks:** Only the authenticated author can update or delete a blog.
- **Personal dashboard:** Profile details and a list of only the signed-in user's blogs.
- **Search and categories:** Client-side search across title, content, and author, plus category filtering.
- **Responsive UI:** Mobile-friendly navigation, forms, cards, and dashboard.
- **MongoDB persistence:** Mongoose models for users and blogs.
- **Deployment-ready:** Environment-based configuration and a Render Blueprint.

## Technology stack

- HTML5, CSS3, vanilla JavaScript
- Node.js and Express
- MongoDB Atlas and Mongoose
- JSON Web Tokens (`jsonwebtoken`)
- `bcryptjs` for password hashing
- `express-rate-limit` for authentication endpoint rate limiting

## Project structure

```text
Blog-application/
├── models/
│   ├── Blog.js
│   └── User.js
├── public/
│   ├── css/style.css
│   ├── js/script.js
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── create-blog.html
│   └── blog-details.html
├── .env.example
├── .gitignore
├── package.json
├── render.yaml
└── server.js
```

## Requirements

- Node.js 18 or newer
- npm
- A MongoDB database, such as MongoDB Atlas

## Run locally

1. Open a terminal in the project directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file by copying `.env.example` to `.env`.
4. Set the environment variables in `.env`:

   ```dotenv
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://DB_USER:DB_PASSWORD@YOUR_CLUSTER.mongodb.net/blogspace
   JWT_SECRET=your-long-random-secret-at-least-32-characters
   ```

   Replace the example MongoDB URI with your own Atlas connection string. URL-encode special characters in the database username/password where needed. In MongoDB Atlas, create a database user and allow network access from the environment that will run the app.

5. Start the server:

   ```bash
   npm start
   ```

   For development with Node's watch mode:

   ```bash
   npm run dev
   ```

6. Visit [http://localhost:3000](http://localhost:3000).

**Do not open the HTML files directly from the filesystem.** Use the Express URL so API requests work correctly.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Port for the Express server; hosting providers set this automatically. |
| `MONGODB_URI` | Yes | MongoDB connection URI. |
| `JWT_SECRET` | Yes | Random secret of at least 32 characters used to sign JWTs. |
| `NODE_ENV` | No | Set to `production` when deployed. |

Keep `.env` private. It is ignored by Git. Never commit database credentials or JWT secrets.

## API overview

| Method | Endpoint | Authentication | Description |
|---|---|---|---|
| `GET` | `/api` | No | Health check |
| `POST` | `/api/auth/register` | No | Create a user account |
| `POST` | `/api/auth/login` | No | Sign in and receive a JWT |
| `GET` | `/api/auth/me` | Bearer token | Get the current user's profile |
| `GET` | `/api/blogs` | No | List all blogs |
| `GET` | `/api/blogs/:id` | No | Get a blog by ID |
| `GET` | `/api/my-blogs` | Bearer token | List the signed-in user's blogs |
| `POST` | `/api/blogs` | Bearer token | Create a blog |
| `PUT` | `/api/blogs/:id` | Bearer token + owner | Update a blog |
| `DELETE` | `/api/blogs/:id` | Bearer token + owner | Delete a blog |

Authenticated requests use:

```http
Authorization: Bearer YOUR_JWT
```

A blog body uses `title`, `category`, `content`, and optional `image` (an HTTP or HTTPS URL). Passwords are never returned by the API.

## Deploy to Render

This repository includes a `render.yaml` Blueprint.

1. Push the project to a GitHub repository.
2. In Render, create a new **Blueprint** and connect the repository, or create a Web Service from the repository.
3. Confirm the build command is `npm install` and the start command is `npm start`.
4. Add the `MONGODB_URI` and `JWT_SECRET` values in Render's environment settings. Do not put secrets in `render.yaml` or Git.
5. In MongoDB Atlas, allow the Render service to reach the database. For stronger security, restrict network access where possible rather than leaving the database open to all IPs.
6. Deploy and open the generated Render URL.
7. Test registration, login, blog creation, editing, deletion, search, category filtering, and the dashboard using two different accounts.

Render's free service may spin down after inactivity, so the first request after a period of inactivity can take longer.

## Security notes

- Passwords are hashed with bcrypt.
- JWTs expire after two hours and are verified using HS256.
- Authentication endpoints are rate-limited.
- API routes enforce blog ownership on the server; hiding edit/delete controls in the browser is not the security boundary.
- The current frontend stores the JWT in `localStorage`. This is straightforward for a learning project but is more exposed to successful cross-site scripting than an `HttpOnly`, `Secure`, `SameSite` cookie approach. For a higher-security production deployment, consider server-managed sessions or secure cookies, CSRF protections where applicable, and additional monitoring.
- The dashboard route is guarded in client-side JavaScript; the API is the authoritative security boundary for private data and mutations.

## Current scope

- Cover images are external HTTP(S) URLs; image upload/storage is not implemented.
- Search and category filtering are performed in the browser after the public blog list is fetched.
- Drafts, comments, likes, password reset, and pagination are not implemented.

## License

Add a license file if you intend to distribute or reuse this project publicly.
