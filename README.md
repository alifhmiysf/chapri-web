# Chapri

<p align="center">
  <strong>Personal Productivity & Collaborative Workspace</strong>
</p>

<p align="center">
  A web-based productivity application for managing personal tasks, collaborating with teams, and communicating in one workspace.
</p>

---

## Table of Contents

- [About Chapri](#about-chapri)
- [Project Goals](#project-goals)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Firebase Configuration](#firebase-configuration)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Available Scripts](#available-scripts)
- [Application Architecture](#application-architecture)
- [Firestore Data Management](#firestore-data-management)
- [Build and Deployment](#build-and-deployment)
- [Development Guidelines](#development-guidelines)
- [Troubleshooting](#troubleshooting)

---

## About Chapri

**Chapri** is a web-based productivity and collaboration application designed to help individuals and teams organize their work in one place.

The application combines personal task management, group workspaces, task collaboration, and real-time communication. Users can manage their individual responsibilities while also participating in collaborative projects with other members.

Chapri aims to provide a simple and organized workspace where users can plan activities, track progress, share information, and communicate without having to switch between multiple applications.

### Project Information

| Item | Description |
|---|---|
| Application Name | Chapri |
| Repository / Project Name | chapri-web |
| Project Type | Web Application |
| Frontend | React + TypeScript |
| Build Tool | Vite |
| Database | Cloud Firestore |
| Authentication | Firebase Authentication |
| Styling | Tailwind CSS |
| Package Manager | npm |

---

## Project Goals

Chapri is developed with the following goals:

1. Provide a centralized platform for managing personal tasks.
2. Help users collaborate through shared group workspaces.
3. Make task assignment and progress tracking easier.
4. Provide communication features for group members.
5. Allow users to share tasks and project information.
6. Provide public project sharing capabilities.
7. Deliver a responsive and accessible interface across desktop and mobile devices.

---

## Features

### 1. Authentication

Chapri provides user authentication through Firebase Authentication.

Available authentication pages:

- Login.
- User registration.
- Protected application routes.
- Authentication state management.
- Automatic access control for authenticated users.

### 2. Dashboard

The dashboard provides an overview of the user's workspace and productivity.

It serves as the main entry point after authentication and provides access to the application's primary features.

### 3. Personal Task Management

Users can create and manage their own tasks.

Available functionality includes:

- Create personal tasks.
- Edit existing tasks.
- Delete tasks.
- Set task descriptions.
- Set task priorities.
- Manage task status.
- Filter tasks based on progress.
- Track completed and unfinished tasks.

Task statuses:

- To Do
- In Progress
- Completed

### 4. Group Workspace

Users can create and participate in collaborative workspaces.

Group functionality includes:

- Create a group.
- View available groups.
- Open group details.
- Manage group information.
- View group members.
- Manage member roles according to permissions.
- Join or leave a group.
- Invite other users using an invitation code.

### 5. Group Task Management

Each group can manage its own collection of collaborative tasks.

Available functionality includes:

- Create group tasks.
- Edit task details.
- Delete tasks.
- Assign tasks to members.
- Set task priorities.
- Set deadlines.
- Update task status.
- Track group task progress.
- Share tasks through the group chat.
- Move tasks between status columns using drag-and-drop interactions.

### 6. Group Chat

Each group provides a dedicated communication space.

Users can:

- Send messages to group members.
- View group conversations.
- Communicate within the associated workspace.
- Share task information through chat.

### 7. Private Chat

Chapri also provides private conversations between users.

The private chat feature allows users to communicate individually outside group conversations.

### 8. Task Sharing

Users can share task information through chat.

Shared task information is displayed using a dedicated task-sharing component, making it easier for members to understand the task being discussed.

### 9. Public Project Sharing

Groups can enable public project sharing.

This feature allows project information to be accessed through a public sharing link.

Available functionality includes:

- Enable public project sharing.
- Disable public project sharing.
- Generate or retrieve a public sharing identifier.
- Copy the public project link.
- Open the public project page.
- Display publicly shared project information.

Public project pages are implemented through the `PublicProject` page.

### 10. Responsive Interface

Chapri is designed to support different screen sizes.

The interface includes layouts for desktop and mobile devices, with responsive navigation and content presentation.

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | Component-based user interface |
| TypeScript 6 | Static typing and safer development |
| Vite 8 | Development server and build tooling |
| React Router 7 | Client-side routing |
| Tailwind CSS 4 | Utility-first styling |
| Lucide React | Interface icons |

### Backend and Database Services

| Technology | Purpose |
|---|---|
| Firebase Authentication | User authentication |
| Cloud Firestore | NoSQL database |
| Firebase SDK | Communication with Firebase services |

Chapri uses Firebase as its backend service. The application communicates with Firebase directly through the Firebase SDK.

### Development Tools

- Node.js
- npm
- TypeScript
- ESLint
- Git
- Visual Studio Code

---

## Project Structure

The following is the current project directory structure.

```text
chapri-web/
│
├── .github/
│   └── modernize/
│       └── code-migration/
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
├── src/
│   │
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── chat/
│   │   │   ├── GroupChatPanel.tsx
│   │   │   ├── SharedTaskCard.tsx
│   │   │   └── ShareTaskModal.tsx
│   │   │
│   │   ├── groups/
│   │   │   ├── GroupCard.tsx
│   │   │   ├── GroupForm.tsx
│   │   │   ├── GroupTaskItem.tsx
│   │   │   └── MemberList.tsx
│   │   │
│   │   ├── layout/
│   │   │   └── AppLayout.tsx
│   │   │
│   │   └── tasks/
│   │       ├── TaskForm.tsx
│   │       ├── TaskItem.css
│   │       └── TaskItem.tsx
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatRoom.tsx
│   │   │   └── PrivateChats.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx
│   │   │
│   │   ├── groups/
│   │   │   ├── GroupDetail.tsx
│   │   │   └── Groups.tsx
│   │   │
│   │   └── public/
│   │       ├── PublicProject.css
│   │       └── PublicProject.tsx
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   └── authService.ts
│   │   │
│   │   ├── chat/
│   │   │   ├── chatService.ts
│   │   │   ├── groupChatService.ts
│   │   │   └── taskShareService.ts
│   │   │
│   │   ├── firebase/
│   │   │   └── config.ts
│   │   │
│   │   ├── groups/
│   │   │   ├── groupService.ts
│   │   │   ├── groupTaskService.ts
│   │   │   └── publicProjectService.ts
│   │   │
│   │   └── tasks/
│   │       └── taskService.ts
│   │
│   ├── styles/
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   └── groups.css
│   │
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

### Root Files

| File | Description |
|---|---|
| `package.json` | Project metadata, dependencies, and npm scripts. |
| `package-lock.json` | Locks dependency versions for consistent installation. |
| `index.html` | Main HTML entry point used by Vite. |
| `vite.config.ts` | Vite configuration and development plugins. |
| `eslint.config.js` | ESLint configuration for code quality checks. |
| `tsconfig.json` | Main TypeScript configuration. |
| `tsconfig.app.json` | TypeScript configuration for application code. |
| `tsconfig.node.json` | TypeScript configuration for Node-based configuration files. |
| `.gitignore` | Specifies files and folders excluded from Git. |
| `README.md` | Project documentation. |

### Public Directory

| File | Description |
|---|---|
| `favicon.svg` | Browser favicon. |
| `icons.svg` | SVG icon assets. |

### Assets Directory

| File | Description |
|---|---|
| `hero.png` | Main visual asset used by the application. |
| `react.svg` | React starter asset. |
| `vite.svg` | Vite starter asset. |

### Components Directory

Contains reusable interface components shared across application pages.

| File | Description |
|---|---|
| `auth/ProtectedRoute.tsx` | Controls access to protected routes based on authentication. |
| `chat/GroupChatPanel.tsx` | Group chat interface. |
| `chat/SharedTaskCard.tsx` | Displays task information shared through chat. |
| `chat/ShareTaskModal.tsx` | Modal for sharing tasks. |
| `groups/GroupCard.tsx` | Displays group information in a reusable card. |
| `groups/GroupForm.tsx` | Form for creating or managing group information. |
| `groups/GroupTaskItem.tsx` | Displays individual group task information. |
| `groups/MemberList.tsx` | Displays and manages group members. |
| `layout/AppLayout.tsx` | Shared application layout and navigation. |
| `tasks/TaskForm.tsx` | Form for creating or editing personal tasks. |
| `tasks/TaskItem.tsx` | Displays individual personal tasks. |
| `tasks/TaskItem.css` | Styles for personal task items. |

### Contexts Directory

| File | Description |
|---|---|
| `AuthContext.tsx` | Provides authentication state and user information across the application. |

### Pages Directory

Contains the main application pages.

| File | Description |
|---|---|
| `auth/Login.tsx` | User login page. |
| `auth/Register.tsx` | User registration page. |
| `chat/ChatRoom.tsx` | Private chat conversation page. |
| `chat/PrivateChats.tsx` | Private conversation list. |
| `dashboard/Dashboard.tsx` | Main user dashboard. |
| `groups/GroupDetail.tsx` | Group overview, tasks, chat, members, and settings. |
| `groups/Groups.tsx` | Group listing and group management page. |
| `public/PublicProject.tsx` | Publicly accessible project page. |
| `public/PublicProject.css` | Styling for public project pages. |

### Services Directory

Contains application logic for communicating with Firebase and managing application data.

| File | Description |
|---|---|
| `auth/authService.ts` | Authentication-related operations. |
| `chat/chatService.ts` | Private chat operations. |
| `chat/groupChatService.ts` | Group chat operations. |
| `chat/taskShareService.ts` | Task-sharing data operations. |
| `firebase/config.ts` | Firebase initialization and configuration. |
| `groups/groupService.ts` | Group creation, retrieval, membership, and management operations. |
| `groups/groupTaskService.ts` | Group task operations. |
| `groups/publicProjectService.ts` | Public project sharing operations. |
| `tasks/taskService.ts` | Personal task operations. |

### Styles Directory

Contains page-level styles.

| File | Description |
|---|---|
| `auth.css` | Authentication page styles. |
| `dashboard.css` | Dashboard styles. |
| `groups.css` | Group-related page styles. |

### Main Application Files

| File | Description |
|---|---|
| `App.tsx` | Main application component and routing configuration. |
| `App.css` | Application-level styles. |
| `index.css` | Global styles and Tailwind CSS entry point. |
| `main.tsx` | React application entry point. |

---

## Requirements

Before installing Chapri, make sure the following tools are available:

| Requirement | Recommended |
|---|---|
| Node.js | Version 20 or newer |
| npm | Version compatible with installed Node.js |
| Git | Latest stable version |
| Code Editor | Visual Studio Code |
| Firebase Account | Required |

The project currently uses React 19, TypeScript 6, and Vite 8.

---

## Installation

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
```

Navigate to the project directory:

```bash
cd chapri-web
```

### 2. Install Dependencies

```bash
npm install
```

This installs all dependencies defined in `package.json`.

### 3. Configure Firebase

Create or configure a Firebase project in the Firebase Console.

Firebase Console:

https://console.firebase.google.com/

Configure the required Firebase services:

- Authentication
- Cloud Firestore

Enable the authentication providers used by the application.

Create a Firestore database and configure its security rules according to the application's data structure and access requirements.

### 4. Configure Firebase Credentials

Firebase configuration is located in:

```text
src/services/firebase/config.ts
```

Configure the Firebase credentials required by this file.

If the application reads credentials through Vite environment variables, create a `.env.local` file in the project root and provide the corresponding values.

Example using the conventional Vite Firebase variable names:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important:** The variable names above are a suggested convention. They must match the names actually referenced by `src/services/firebase/config.ts`. Do not add variables that the application does not use.

Never commit private credentials, service account files, or other sensitive configuration to a public repository.

---

## Environment Variables

Vite exposes client-side environment variables using the `VITE_` prefix.

Example:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

The `.env.local` file should remain local and should not be committed to Git.

The project should include an appropriate `.gitignore` entry for local environment files.

---

## Running the Application

Start the development server:

```bash
npm run dev
```

Vite will provide a local development URL, usually:

```text
http://localhost:5173
```

Open the URL in a browser to access Chapri.

To stop the development server, press:

```text
Ctrl + C
```

---

## Available Scripts

The following scripts are defined in `package.json`.

| Command | Description |
|---|---|
| `npm install` | Installs project dependencies. |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Runs TypeScript project checks and builds the production application. |
| `npm run lint` | Runs ESLint to check code quality. |
| `npm run preview` | Previews the production build locally. |

### Production Build

Run:

```bash
npm run build
```

The production output is generated in:

```text
dist/
```

### Preview Production Build

After building the application:

```bash
npm run preview
```

---

## Application Architecture

Chapri uses a component-based frontend architecture.

The application separates responsibilities into pages, reusable components, contexts, and services.

### 1. Pages

The `pages/` directory contains the main screens users interact with.

Examples:

- Login
- Register
- Dashboard
- Groups
- Group Detail
- Private Chats
- Chat Room
- Public Project

### 2. Components

The `components/` directory contains reusable UI elements.

Components are organized by their responsibilities, such as authentication, chat, groups, tasks, and application layout.

### 3. Contexts

The `contexts/` directory provides shared application state.

`AuthContext.tsx` is responsible for exposing authentication information to components that need it.

### 4. Services

The `services/` directory separates data operations from UI components.

For example:

- Personal task operations are handled by `taskService.ts`.
- Group operations are handled by `groupService.ts`.
- Group task operations are handled by `groupTaskService.ts`.
- Chat operations are handled by chat services.
- Firebase initialization is handled by `config.ts`.

This separation makes application code easier to maintain and extend.

---

## Firestore Data Management

Chapri uses Cloud Firestore as its primary database.

Application data is organized through collections and documents.

The services directory contains the operations responsible for accessing and updating Firestore data.

Main data domains include:

| Data Domain | Responsible Service |
|---|---|
| User authentication | `authService.ts` |
| Personal tasks | `taskService.ts` |
| Groups and memberships | `groupService.ts` |
| Group tasks | `groupTaskService.ts` |
| Private conversations | `chatService.ts` |
| Group conversations | `groupChatService.ts` |
| Shared tasks | `taskShareService.ts` |
| Public project sharing | `publicProjectService.ts` |

### Security Considerations

Firestore Security Rules should enforce access control on the database itself.

At minimum, rules should consider:

- Authenticated user access.
- Ownership of personal task documents.
- Group membership requirements.
- Group owner and administrator permissions.
- Permissions for creating, editing, and deleting group tasks.
- Access to group chat messages.
- Private chat participant authorization.
- Access to publicly shared project data.

**Important:** Hiding a button in the frontend is not sufficient security. All sensitive operations must also be protected by Firestore Security Rules or a trusted backend.

---

## Build and Deployment

Chapri can be deployed to a static web hosting provider that supports modern frontend applications.

Examples include:

- Firebase Hosting
- Vercel
- Netlify
- Other static hosting providers

### Deployment Steps

1. Install dependencies.
2. Configure production Firebase settings.
3. Run the production build.
4. Deploy the generated `dist/` directory.
5. Configure the hosting provider to serve the application.

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

### SPA Routing Configuration

Because Chapri uses React Router, the hosting provider must support SPA fallback routing.

Requests to application routes should serve `index.html` so that routes can be handled by React Router.

Without this configuration, directly refreshing a nested route may result in a 404 response.

---

## Development Guidelines

To maintain consistency when contributing to Chapri, follow these guidelines.

### Component Organization

- Keep reusable UI components inside `src/components/`.
- Keep full-page views inside `src/pages/`.
- Keep Firebase data operations inside `src/services/`.
- Keep shared authentication state inside `src/contexts/`.
- Keep reusable styles organized in their corresponding CSS files.

### TypeScript

- Use TypeScript for application code.
- Define interfaces and types for data structures.
- Avoid unnecessary use of `any`.
- Keep service function return types consistent.

### Code Quality

Before committing changes, run:

```bash
npm run lint
```

Then verify that the application builds successfully:

```bash
npm run build
```

### Git Workflow

A simple development workflow:

```bash
git status
git add .
git commit -m "Describe your changes"
git push
```

Suggested commit message examples:

```text
feat: add personal task management
feat: implement group chat
feat: add public project sharing
fix: resolve group task status update
fix: improve responsive navigation
style: refine dashboard layout
refactor: organize Firebase services
docs: update project documentation
```

---

## Troubleshooting

### 1. Dependencies Cannot Be Installed

Try:

```bash
npm install
```

If dependency installation continues to fail, check the installed Node.js and npm versions:

```bash
node -v
npm -v
```

### 2. Firebase Configuration Error

Check:

- Firebase project configuration.
- Firebase Authentication settings.
- Firestore database availability.
- Environment variable names.
- Whether `.env.local` is in the project root.
- Whether the Vite development server was restarted after changing environment variables.

### 3. Firestore Permission Denied

A `permission-denied` error usually indicates that the active Firestore Security Rules do not permit the requested operation.

Review the user's authentication state, group membership, document ownership, and relevant database rules.

Do not solve permission errors by making the entire database publicly readable or writable.

### 4. Page Returns 404 After Refresh

Configure the hosting provider to redirect application routes to `index.html`.

This is required for client-side routing with React Router.

### 5. Build Fails

Run:

```bash
npm run build
```

Review the TypeScript errors and resolve them before deploying.

### 6. Changes Are Not Reflected

Try restarting the Vite development server:

```bash
npm run dev
```

Also check the browser console for runtime errors.

---

## Future Improvements

Potential areas for future development include:

- Improved task filtering and sorting.
- More detailed productivity statistics.
- Additional workspace customization.
- Improved notification system.
- Enhanced collaboration features.
- Additional task organization tools.
- Improved mobile experience.
- More comprehensive automated testing.

These are potential development directions and are not necessarily implemented in the current version.

---

## License

This project is currently maintained as a development project.

Add an appropriate open-source license if the project is intended for public distribution.

---

## Author

**Chapri Development Team**

Project: `chapri-web`

---

<p align="center">
  <strong>Chapri — Organize Your Work. Collaborate Better.</strong>
</p>