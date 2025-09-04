# 🕒 Staff Attendance & Reports System

A modern web-based system for **tracking staff attendance, managing
entry/exit times, and generating reports**, built with **Next.js 14 (App
Router)**, **shadcn/ui**, and **TypeScript**.

<img align="left" src="https://wakatime.com/badge/user/162dd9c9-7c7f-462e-81ef-741960841996/project/8f2ebebb-ca9f-44f4-b45d-048d06158227.svg" alt="Total time coded" />

<p align="center">
<img src="public/logo.png" alt="Project Logo" width="180" />
</p>

---

## ✨ Overview

This project provides a unified interface for both **staff** and
**administrators**:

- Staff can log in, view their attendance records, and check working
  hours.
- Administrators can generate staff reports, manage attendance, and
  view aggregated analytics.

The UI is fully responsive and leverages **shadcn/ui** for a consistent,
accessible design.

---

## 🚀 Features

- 🔑 Authentication & role-based access (Admin / Staff)
- 📊 Staff attendance dashboard
- 📝 Reports page (for Admins only)
- 📅 Time tracking (entry, exit, lunch breaks)
- 🌙 Beautiful UI components powered by shadcn/ui
- 🌍 Timezone-aware formatting (Toronto)
- 📱 Responsive layout for mobile and desktop
- ⚡ API endpoints for attendance logging & reporting

---

## 🛠 Tech Stack

- [Next.js 14 (App Router)](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma ORM](https://www.prisma.io/) (for DB layer)
- [PostgreSQL](https://www.postgresql.org/) or \[SQLite\] (dev)
- [NextAuth.js](https://next-auth.js.org/) (authentication)
- [date-fns + date-fns-tz](https://date-fns.org/) (time formatting)
- [Iconify](https://iconify.design/) (icons)

---

## ⚙️ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/staff-attendance-reports.git
cd staff-attendance-reports
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure environment variables

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/attendance"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Start the dev server

```bash
npm run dev
```

App runs on <http://localhost:3000>

---

## 📂 Folder Structure

    .
    ├── app/                     # Next.js App Router
    │   ├── admin/               # Admin-only pages
    │   ├── api/                 # API routes
    │   └── (auth)/              # Authentication routes
    ├── components/              # UI components
    ├── lib/                     # Utils & helpers
    ├── prisma/                  # Prisma schema
    ├── public/                  # Static files
    └── utils/torontoDateFormat  # Date formatting helpers

---

## 🔌 API Routes

- `POST /api/attendance` → log entry/exit/lunch
- `GET /api/attendance/:userId` → fetch staff logs
- `GET /api/reports` → admin reports

---

## 👥 Contributing

Contributions are welcome!

1.  Fork the repo
2.  Create a feature branch (`git checkout -b feature/your-feature`)
3.  Commit your changes (`git commit -m "Add feature"`)
4.  Push to branch (`git push origin feature/your-feature`)
5.  Open a Pull Request 🚀

---

## 📜 License

MIT License © 2025 Alvin Kigen

---

## 🙌 Acknowledgements

- [shadcn/ui](https://ui.shadcn.com/) for clean UI components
- [date-fns](https://date-fns.org/) for time manipulation
- [Prisma](https://www.prisma.io/) for database layer
- [NextAuth](https://next-auth.js.org/) for auth
