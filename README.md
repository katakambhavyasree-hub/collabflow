# CollabFlow – Real-Time Collaborative Project Management Platform

CollabFlow is a web-based project management application designed to help users organize projects, manage tasks, and collaborate efficiently. It provides a centralized platform for tracking project progress and managing team activities.

## Live Demo

**Website:** (https://collabflow-gkbb.vercel.app/)

## Features

- User registration and login
- Project creation and management
- Task organization and tracking
- Task assignment and status management
- Dashboard for monitoring project activities
- Real-time communication using Socket.IO

## Tech Stack

**Frontend**
- React.js
- Vite
- Tailwind CSS

**Backend**
- Node.js
- Express.js
- TypeScript

**Database**
- MySQL

**Real-Time Communication**
- Socket.IO

**Deployment**
- Vercel – Frontend
- Render – Backend

## Project Structure

```text
CollabFlow/
├── client/              # Frontend application
├── server/              # Backend routes, controllers and logic
├── server.ts            # Server entry point
├── package.json         # Project dependencies and scripts
├── vite.config.ts       # Vite configuration
└── README.md
```


## Getting Started

### Prerequisites

- Node.js and npm
- MySQL, if using the MySQL database configuration

## Deployment

The frontend is deployed using Vercel, and the backend is hosted on Render. Environment variables are configured to connect the frontend to the backend API and real-time services.

## Learning Outcomes

Through this project, I gained practical experience in:

- Full-stack web application development
- Connecting frontend and backend services
- REST API integration
- Real-time communication using Socket.IO
- Environment variable configuration
- Cloud deployment and debugging
- Resolving cross-origin resource sharing (CORS) issues

## Future Improvements

- Persistent cloud database integration
- Enhanced team collaboration features
- Improved notifications and activity tracking
- More detailed project analytics

## Author

Developed as a hands-on full-stack web development project to strengthen practical programming, debugging, and deployment skills.
