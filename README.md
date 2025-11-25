# Receipt OCR

This is a full-stack application that allows users to upload images of receipts, performs Optical Character Recognition (OCR) to extract the text, and uses a generative AI to parse the text into structured data.

## Tech Stack

### Backend

- **Framework**: [NestJS](https://nestjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **API**: [GraphQL](https://graphql.org/)
- **OCR Engine**: [Tesseract.js](https://tesseract.projectnaptha.com/) (via a custom implementation)
- **AI**: [Google Gemini](https://ai.google.dev/)
- **Job Queue**: [Bull](https://github.com/OptimalBits/bull) with [Redis](https://redis.io/)
- **Containerization**: [Docker](https://www.docker.com/)

### Frontend

- **Framework**: [Next.js](https://nextjs.org/)
- **UI**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Hooks
- **GraphQL Client**: Custom implementation using `fetch`

## Setup & Run Instructions

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- `pnpm` (for local development)

### Running the Application

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```

2.  **Create environment files:**

    Create a `.env` file in the root directory and a `.env` file in the `backend` directory.

    **Root `.env`:**

    ```env
    POSTGRES_USER=myuser
    POSTGRES_PASSWORD=mypassword
    POSTGRES_DB=mydb
    REDIS_PASSWORD=myredispassword
    ```

    **`backend/.env`:**

    ```env
    GOOGLE_API_KEY=your_google_api_key
    ```

    Replace `your_google_api_key` with your actual Google Gemini API key.

3.  **Build and run with Docker Compose:**

    ```bash
    docker-compose up --build
    ```

    This will start the backend, frontend, database, and cache services.

    - Frontend will be available at `http://localhost:3000`
    - Backend GraphQL Playground will be at `http://localhost:3333/graphql`
    - Bull Board (for queue monitoring) will be at `http://localhost:5555/admin/queues`

## How to Extend the App

### Add User Accounts

1.  **Update Prisma Schema:** Add a `User` model to `backend/prisma/schema.prisma` with fields like `email`, `password` (hashed), etc.
2.  **Authentication Service:** Create a new module in the backend for authentication (e.g., `auth.module.ts`). Implement services for user registration, login, and password management. Use a library like `bcrypt` for password hashing and `jsonwebtoken` for session management.
3.  **Protect GraphQL Resolvers:** Use NestJS Guards to protect resolvers that should only be accessible to authenticated users.
4.  **Frontend Integration:** Create login and registration pages in the frontend. Manage user sessions and tokens (e.g., using React Context or a state management library).

### Receipt Categorization

1.  **Update Prisma Schema:** Add a `Category` model and a relation to the `Receipt` model.
2.  **AI Prompt Engineering:** Modify the prompt sent to the generative AI in `backend/src/ocr/ocr.service.ts` to include instructions for categorizing the receipt based on its content (e.g., "Groceries", "Electronics", "Dining").
3.  **Backend Logic:** Update the `OcrService` to handle the new `category` field from the AI's response and save it to the database.
4.  **Frontend UI:** Add UI elements to display and filter receipts by category. This could be a dropdown in the `FilterBar` component.

### Export Data

1.  **Backend Exporter Service:** Create a new service that can generate different file formats (e.g., CSV, JSON). This service would fetch receipt data for a user and format it.
2.  **New GraphQL Resolver:** Add a new resolver (e.g., `exportReceipts`) that takes format and date range as arguments and returns the file content as a string or a URL to the generated file.
3.  **Frontend Feature:** Add an "Export" button to the UI. When clicked, it would call the `exportReceipts` mutation and trigger a file download in the browser. For large exports, this could be a background job that notifies the user when the file is ready.
