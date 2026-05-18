# Kindergarten Management System Backend

Rails API backend for the Kindergarten Management System.

## Core Capabilities

- Independent admin, teacher, and parent JWT authentication.
- Admin API under `/admin/*` for global teachers, classrooms, students, parents, parent-child approvals, attendance, discipline, and summary metrics.
- Teacher permissions are scoped to the assigned classroom: students, attendance, discipline, class parents, and own profile only.
- Teacher account creation and class assignment are admin-only.
- Parents can self-register and request child links by admission number via `POST /parent_students`.
- Parent-child links require admin approval before parents can view child, attendance, or discipline data.
- Attendance tracking scoped by class, student, and date.
- Discipline records scoped by class for teachers and approved linked children for parents.

## Default Admin

`db:seed` creates a default admin account. It reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` when set, otherwise uses:

```text
admin@example.com / admin123
```

Admin-created teacher and parent accounts use `DEFAULT_ACCOUNT_PASSWORD` when no password is provided, defaulting to `123456`.

## Environment Variables

```bash
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRATION_HOURS=8
ALLOWED_ORIGINS=http://localhost:4000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
DEFAULT_ACCOUNT_PASSWORD=123456
```

`JWT_SECRET` is required in production. If `config/master.key` or any JWT secret has ever been committed or shared, rotate it before deploying.

## Common Commands

```bash
bundle install
bin/rails db:prepare
bin/rails server -b 0.0.0.0 -p 3000
bin/rails test
```

To rebuild local data from scratch:

```bash
bin/rails db:drop db:create db:migrate db:seed
```

When running from the repository root with Docker:

```bash
docker compose run --rm backend bundle exec rails test
```
