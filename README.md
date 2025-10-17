# Tirelire API

## Code Quality & Test Coverage

This project is analyzed with SonarQube.

- **Coverage:** ![Coverage](https://img.shields.io/badge/Coverage-86.1%25-brightgreen)
- **Quality Gate:** Passed

For more details, see the SonarQube dashboard.

## Description

Tirelire is a RESTful API built with Node.js for collaborative financial management. It enables users to create and manage savings groups, track contributions, handle payments, perform KYC verification, and manage support tickets, making group-based transactions simple and secure.

## Features

- **User Authentication**: Secure login and registration with JWT.
- **Group Management**: Create, update, and manage savings groups.
- **Contributions**: Track and manage group member contributions.
- **Payments**: Handle group and individual payments.
- **KYC Verification**: Integrate KYC processes for user verification.
- **Ticketing**: Support for user support tickets.
- **Notifications**: Email notifications for important events.
- **Scheduler**: Automated jobs for recurring tasks.

## Tech Stack

- **Node.js** (Express)
- **MongoDB** (Mongoose)
- **Jest** for testing
- **Docker** support

## Project Structure

```
├── src/
│   ├── controllers/      # Route controllers
│   ├── models/           # Mongoose models
│   ├── repositories/     # Data access logic
│   ├── services/         # Business logic
│   ├── middlewares/      # Express middlewares
│   ├── routes/           # API routes
│   ├── jobs/             # Scheduled jobs
│   ├── uploads/          # Encrypted file uploads
│   ├── utils/            # Utility functions
│   └── app.js            # App entry point
├── test/                 # Unit and integration tests
├── Dockerfile            # Docker configuration
├── package.json          # NPM dependencies
├── jest.config.mjs       # Jest configuration
├── sonar-project.properties # SonarQube config
```

## Getting Started

### Prerequisites

- Node.js (v20.19.5 recommended)
- MongoDB
- Docker (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/medlaq777/Tirelire-API.git
   cd Tirelire-API
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `src/config/config.js` as needed.

### Running the App

- Start the server:
  ```bash
  npm start
  ```
- For development with auto-reload:
  ```bash
  npm run dev
  ```
- Run tests:
  ```bash
  npm test
  ```
- Run with Docker:
  ```bash
  docker build -t tirelire-api .
  docker run -p 3000:3000 tirelire-api
  ```

## API Documentation

- API endpoints are organized by resource (auth, group, contribution, payment, kyc, ticket).
- See the `src/routes/` directory for route definitions.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
