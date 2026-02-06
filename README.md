# AI Business Management

A modern full-stack web application built with **React**, **Tailwind CSS**, and **Firebase**.

## Project Setup

This project is configured with:
- ⚛️ React 18 with TypeScript
- 🎨 Tailwind CSS for styling
- 🔥 Firebase for backend services (Auth, Firestore, Storage)
- ⚡ Vite for fast development and optimized builds
- 📋 ESLint for code quality

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase credentials in `src/config/firebase.ts`

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── config/
│   └── firebase.ts          # Firebase configuration
├── App.tsx                  # Main App component
├── main.tsx                 # Entry point
├── index.css                # Global styles
└── App.css                  # App specific styles
```

## Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Firebase Configuration

Update your Firebase configuration in `src/config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Next Steps

Ready to start building! Tell me what features you'd like to add:
- User authentication
- Database operations
- Data visualization
- Real-time updates
- Other custom features

---

Happy coding! 🚀
