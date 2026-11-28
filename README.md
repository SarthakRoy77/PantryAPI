# Pantry API
- This is an API for a pantry service with admin and user routes to manage a pantry efficiently, using PostgreSQL as the database provider and Prisma ORM 8 for handling requests and managing data efficiently.

- The main API is built using Express.

- Imports are used in the form of ES Modules.

### Remember:
```bash
npx prisma contract emit
npx prisma migration plan
npx prisma db migrate
```
- Use the commands above to migrate and update the schema.

```bash
npx tsc
```
- Use the command above to compile `src` and migrations into JavaScript for importing and using Prisma ORM 8 after every migration to apply changes.

- Visit `env.example` to create your own `.env`:

```dotenv
PORT = 3000
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>"
ADMIN_CODE="ADMIN_CODE"
JWT_SECRET_KEY="JWT_SECRET_KEY"
```

## API Routes

**Base URL:** `http://localhost:<PORT>/api/v1`

### Auth & User Routes
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Register a new user or admin (with optional `adminCode`) |
| `POST` | `/login` | Public | Log in using `name` and `password` (sets HTTP-only JWT cookie) |
| `POST` | `/login/:id` | Public | Log in using user `id` and `password` (sets HTTP-only JWT cookie) |
| `DELETE` | `/logout` | Public | Clear authentication cookie and log out |
| `GET` | `/users` | Admin | Retrieve all registered users (password hashes omitted) |
| `DELETE` | `/users/:id` | Admin | Delete a user by ID |

### Food Management Routes
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/FoodItem` | Admin | Add a new food item (`name`, `price`, `calories`) |
| `GET` | `/FoodItem` | Admin | Retrieve all food items |
| `GET` | `/FoodItem/by-price/:price` | Admin | Get food items priced below `:price` |
| `GET` | `/FoodItem/by-calories/:calories` | Admin | Get food items with calories below `:calories` |
| `PATCH` | `/FoodItem/:id` | Admin | Update a food item by ID (`name`, `price`, `calories`) |
| `DELETE` | `/FoodItem/:id` | Admin | Delete a food item by ID |

### Employee Management Routes
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/Employee` | Admin | Add a new employee (`name`, `password`, `wage`, and `employeeType`: `receptionist`, `chefs`, or `manager`) |
| `GET` | `/Employee` | Admin | Retrieve all employees (password hashes omitted) |
| `GET` | `/Employee/by-name/:name` | Admin | Search employees by `name` (case-insensitive partial match) |
| `PATCH` | `/Employee/:id` | Admin | Update an employee by ID (`name`, `password`, `wage`, `employeeType`) |

## Main modules used along with learning links

- Express 5.3.0 as a framework for the API
  Learning Link: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/Introduction

- Prisma ORM 8.0.0-rc.25 for object relational mapping
  Learning Link: https://www.prisma.io/docs

- Bcrypt 6.0.0 for hashing passwords
  Learning Link: https://www.npmjs.com/package/bcrypt

- JWT 9.0.3 for authentication
  Learning Link: https://www.npmjs.com/package/jsonwebtoken