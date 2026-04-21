# Task Management Frontend

This is the frontend implementation for the Task Management application built with SvelteKit.

## Technologies Used

- SvelteKit (TypeScript)
- Tailwind CSS for styling
- Fetch API for HTTP requests

## Features

- User authentication (register/login)
- Task management (CRUD operations)
- Category management (CRUD operations)
- Tag management (CRUD operations)
- Responsive design

## Project Structure

```
src/
├── lib/
│   ├── api/           # API service functions
│   ├── components/    # Reusable components
│   └── types.ts       # TypeScript interfaces
├── routes/
│   ├── auth/          # Authentication pages
│   ├── categories/    # Category management pages
│   ├── tags/          # Tag management pages
│   └── tasks/         # Task management pages
└── app.html           # Main HTML template
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## API Integration

The frontend communicates with the Rust backend API at `http://localhost:3000/api`. Make sure the backend is running before starting the frontend.

## Development

The application uses Tailwind CSS for styling. All components are built with Svelte and TypeScript for type safety.