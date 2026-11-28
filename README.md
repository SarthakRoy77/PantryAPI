# Pantry API
- This is a API for a pantry service with admin and user routes to manage a pantry efficiently with PostgreSQL for database provider and PRISMA 
ORM 8 for handling requests and managing data efficiently

- The main API is made using the Express API

- Imports are used in the form of ES Modules

### Remember:
```bash
npx prisma contract emit
npx prisma migration plan
npx prisma db migrate
``` 
Use the above to migrate and update the schema

```bash
npx tsc
```
Use the above to compile the src and migrations in javascript for importing and using the PRISMA ORM 8 after every migration

## Main modules used along with learning link

- Express 5.3.0 as a framework for the API
Learning Link: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/Introduction

- Prisma ORM 8.0.0-rc.25 for object relational mapping
Learning Link: https://www.prisma.io/docs

- Bcrypt 6.0.0 for Hashing Passwords
Learning Link: https://www.npmjs.com/package/bcrypt

- JWT 9.0.3 for Authentication 
Learning Link: https://www.npmjs.com/package/jsonwebtoken