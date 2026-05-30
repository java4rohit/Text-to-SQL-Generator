# Text-to-SQL Chatbot 🤖

A full-stack application that converts natural language questions into SQL queries and executes them using Google Gemini AI.

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                     (Next.js 14 + React)                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Chat Input   │  │ Schema View  │  │ Results Table│        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└──────────────────────────┬──────────────────────────────────────┘
                          │ HTTP/REST (Port 3000 → 8080)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT BACKEND                          │
│                      (Java 17 + Maven)                          │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │             QueryController (REST API)                  │   │
│  │  • /api/health                                         │   │
│  │  • /api/schema                                         │   │
│  │  • /api/generate-sql                                   │   │
│  │  • /api/query                                          │   │
│  │  • /api/execute-sql                                    │   │
│  └─────────────┬────────────────────────┬─────────────────┘   │
│                │                        │                      │
│                ▼                        ▼                      │
│  ┌─────────────────────┐  ┌──────────────────────────┐       │
│  │  GeminiService      │  │  DatabaseService         │       │
│  │  • Generate SQL     │  │  • Get Schema            │       │
│  │  • AI Integration   │  │  • Execute Queries       │       │
│  └──────────┬──────────┘  └──────────┬───────────────┘       │
└─────────────┼──────────────────────────┼──────────────────────┘
              │                          │
              ▼                          ▼
   ┌──────────────────────┐   ┌──────────────────────┐
   │  Google Gemini API   │   │   MySQL Database     │
   │  (AI Model)          │   │   (text_to_sql)      │
   │  • 2.0 Flash         │   │   • Tables & Data    │
   └──────────────────────┘   └──────────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 14 with React and TypeScript
- **Backend**: Java Spring Boot REST API
- **Database**: MySQL 8.x
- **AI**: Google Gemini 2.0 Flash
- **Communication**: REST API with JSON
- **Styling**: Tailwind CSS

### Component Responsibilities

#### Frontend (Next.js)
- User interface and chat experience
- API communication with backend
- Data visualization (tables, schema)
- State management and loading states

#### Backend (Spring Boot)
- REST API endpoints
- Request validation and routing
- Business logic orchestration
- CORS configuration

#### GeminiService
- Natural language processing
- SQL query generation using AI
- Prompt engineering and context management
- API integration with Google Gemini

#### DatabaseService
- Database connection management
- Schema introspection
- SQL query execution
- Result set processing

## 🔄 Application Flow

### 1. User Query Flow (End-to-End)

```
User Types Question
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ FRONTEND: Chat Interface                                 │
│ • User enters: "Show all employees with salary > 70000"  │
│ • Click Send Button                                      │
└──────────┬───────────────────────────────────────────────┘
           │
           │ POST /api/query
           │ { "question": "Show all employees..." }
           ▼
┌──────────────────────────────────────────────────────────┐
│ BACKEND: QueryController.processQuery()                  │
│ • Receives QueryRequest                                  │
│ • Validates input                                        │
└──────────┬───────────────────────────────────────────────┘
           │
           ├─────────────────┬────────────────────────┐
           ▼                 ▼                        ▼
┌────────────────┐  ┌─────────────────┐   ┌──────────────────┐
│ Step 1:        │  │ Step 2:         │   │ Step 3:          │
│ Get Schema     │  │ Generate SQL    │   │ Execute Query    │
└────────────────┘  └─────────────────┘   └──────────────────┘
```

### 2. Detailed Flow Steps

#### Step 1: Schema Retrieval
```
DatabaseService.getDatabaseSchema()
    │
    ├─→ Query INFORMATION_SCHEMA
    │   (Get tables, columns, data types)
    │
    ├─→ Build schema map
    │   { "employees": { "id": "INT", "name": "VARCHAR", ... } }
    │
    └─→ Return schema structure
```

#### Step 2: SQL Generation (AI)
```
GeminiService.generateSQL(question, schema)
    │
    ├─→ Construct AI prompt with:
    │   • Database schema context
    │   • User question
    │   • Instructions for SQL generation
    │
    ├─→ Call Gemini API
    │   POST https://generativelanguage.googleapis.com/...
    │
    ├─→ Parse AI response
    │   Extract SQL from response
    │
    └─→ Return SQL query
        "SELECT * FROM employees WHERE salary > 70000"
```

#### Step 3: Query Execution
```
DatabaseService.executeQuery(sql)
    │
    ├─→ Create JDBC connection
    │
    ├─→ Execute SQL statement
    │
    ├─→ Process ResultSet
    │   Convert rows to List<Map<String, Object>>
    │
    └─→ Return results
        [
          {"id": 1, "name": "John", "salary": 75000},
          {"id": 3, "name": "Bob", "salary": 80000}
        ]
```

#### Step 4: Response Assembly
```
QueryController
    │
    ├─→ Create QueryResponse
    │   • SQL query
    │   • Execution results
    │   • Row count
    │   • Success status
    │
    └─→ Return JSON response to frontend
```

#### Step 5: Frontend Display
```
Frontend receives response
    │
    ├─→ Display generated SQL query
    │
    ├─→ Render results in table
    │   • Dynamic columns based on data
    │   • Formatted values
    │
    └─→ Show query metadata
        (row count, execution status)
```

### 3. Schema Viewing Flow

```
User clicks "Show Database Schema"
           │
           ▼
GET /api/schema
           │
           ▼
DatabaseService.getDatabaseSchema()
           │
           ├─→ Query all tables
           ├─→ Query all columns
           └─→ Build schema structure
           │
           ▼
Frontend displays schema in expandable view
```

### 4. Error Handling Flow

```
Error occurs at any step
    │
    ├─→ Caught by try-catch blocks
    │
    ├─→ Logged to console/logs
    │
    ├─→ Formatted error response
    │   { "error": "...", "message": "..." }
    │
    └─→ Displayed to user with context
```

### 5. Data Flow Diagram

```
┌──────────┐      Question       ┌──────────┐      Schema       ┌──────────┐
│          │ ──────────────────> │          │ ───────────────> │          │
│ Frontend │                     │ Backend  │                  │ Database │
│          │ <────────────────── │          │ <─────────────── │          │
└──────────┘    SQL + Results    └──────────┘    Schema Data   └──────────┘
                                       │
                                       │ Question + Schema
                                       ▼
                                 ┌──────────┐
                                 │ Gemini   │
                                 │ AI       │
                                 └──────────┘
                                       │
                                       │ Generated SQL
                                       ▼
                                  (Returns to Backend)
```

### 6. Request/Response Cycle

**Request Flow:**
```
User Input → Frontend Validation → HTTP POST → Backend Controller 
→ Service Layer → External Services (AI/DB) → Response Assembly
```

**Response Flow:**
```
Service Results → Controller → JSON Serialization → HTTP Response 
→ Frontend Parsing → State Update → UI Rendering
```

### Key Features of the Architecture

1. **Separation of Concerns**: Clear division between frontend, backend, AI, and database layers
2. **RESTful Design**: Standard HTTP methods and JSON communication
3. **Error Handling**: Comprehensive error management at each layer
4. **Scalability**: Modular design allows easy addition of new features
5. **Security**: CORS configuration, parameterized queries, API key management
6. **Maintainability**: Clean code structure with service layer pattern

## 📁 Project Structure

```
Text-to-SQL-Generator/
├── backend/                     # Java Spring Boot application
│   ├── src/main/java/com/texttosql/
│   │   ├── TextToSqlApplication.java
│   │   ├── config/
│   │   │   └── WebConfig.java   # CORS configuration
│   │   ├── controller/
│   │   │   └── QueryController.java  # REST API endpoints
│   │   ├── model/
│   │   │   ├── QueryRequest.java
│   │   │   └── QueryResponse.java
│   │   └── service/
│   │       ├── DatabaseService.java  # Database operations
│   │       └── GeminiService.java    # AI integration
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
└── frontend/                    # Next.js application
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx             # Main chat interface
    │   └── globals.css
    ├── package.json
    └── next.config.mjs
```

## 🚀 Setup Instructions

### Prerequisites

- Java 17 or higher
- Maven 3.x
- Node.js 18+ and npm
- MySQL 8.x
- Google Gemini API Key

### 1. Database Setup

Create the MySQL database:

```sql
CREATE DATABASE text_to_sql;
```

The application will connect using the credentials in `backend/src/main/resources/application.properties`:
- Host: localhost:3306
- Database: text_to_sql
- Username: root
- Password: Java4rohit1#

Create your database tables as needed. Example:

```sql
USE text_to_sql;

CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    department VARCHAR(50),
    salary DECIMAL(10,2),
    hire_date DATE
);

INSERT INTO employees (name, department, salary, hire_date) VALUES
('John Doe', 'Engineering', 75000, '2020-01-15'),
('Jane Smith', 'Marketing', 65000, '2019-06-20'),
('Bob Johnson', 'Engineering', 80000, '2021-03-10');
```

### 2. Configure Google Gemini API

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Update `backend/src/main/resources/application.properties`:
   ```properties
   gemini.api.key=YOUR_ACTUAL_API_KEY_HERE
   ```

### 3. Backend Setup

```bash
cd backend

# Build the project
mvn clean install

# Run the application
mvn spring-boot:run
```

The backend will start on **http://localhost:8080**

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will start on **http://localhost:3000**

## 🎯 Usage

1. Open your browser and navigate to **http://localhost:3000**
2. Click "Show Database Schema" to view your database structure
3. Type a natural language question in the input field:
   - "Show all employees"
   - "Find employees in Engineering department"
   - "What is the average salary?"
   - "List employees hired after 2020"
4. Press Send or hit Enter
5. The application will:
   - Generate the SQL query
   - Execute it
   - Display the results in a table

## 📡 API Endpoints

### Backend REST API (Port 8080)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/schema` | Get database schema |
| POST | `/api/generate-sql` | Generate SQL from question |
| POST | `/api/query` | Generate SQL and execute |
| POST | `/api/execute-sql` | Execute provided SQL |

### Example API Call

```bash
# Generate and execute SQL
curl -X POST http://localhost:8080/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Show all employees"}'
```

## 🔧 Configuration

### Backend Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
# Server Configuration
server.port=8080

# MySQL Database
spring.datasource.url=jdbc:mysql://localhost:3306/text_to_sql
spring.datasource.username=root
spring.datasource.password=root#

# Gemini AI
gemini.api.key=YOUR_API_KEY_HERE
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

# CORS
cors.allowed.origins=http://localhost:3000
```

### Frontend Configuration

The frontend API base URL is configured in `frontend/app/page.tsx`:

```typescript
const API_BASE_URL = 'http://localhost:8080/api';
```

## 🎨 Features

- ✅ Natural language to SQL conversion
- ✅ Real-time SQL query generation
- ✅ Automatic query execution
- ✅ Results displayed in formatted tables
- ✅ Database schema viewer
- ✅ Error handling and user feedback
- ✅ Responsive chat interface
- ✅ Dark mode support
- ✅ Loading states and animations

## 🛠️ Technologies Used

### Backend
- Spring Boot 3.2.0
- Spring Web (REST API)
- Spring JDBC
- MySQL Connector
- Jackson (JSON processing)

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Axios

### AI
- Google Gemini 2.0 Flash

## 📝 Example Queries

Try these example questions:

- "Show all records from the employees table"
- "Find employees with salary greater than 70000"
- "Count how many employees are in each department"
- "What is the highest salary?"
- "List employees hired in 2021"
- "Show average salary by department"

## 🐛 Troubleshooting

### Backend Issues

**Port 8080 already in use:**
```bash
# Change port in application.properties
server.port=8081
```

**Database connection error:**
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in application.properties
- Ensure database exists: `CREATE DATABASE text_to_sql;`

**Gemini API error:**
- Verify your API key is valid
- Check you have enabled the Gemini API
- Ensure you have API quota remaining

### Frontend Issues

**Port 3000 already in use:**
```bash
# Run on different port
PORT=3001 npm run dev
```

**API connection error:**
- Ensure backend is running on port 8080
- Check CORS configuration
- Verify API_BASE_URL in page.tsx

## 📚 Development

### Build for Production

**Backend:**
```bash
cd backend
mvn clean package
java -jar target/text-to-sql-backend-1.0.0.jar
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## 🤝 Contributing

Feel free to fork this project and submit pull requests!

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Built with ❤️ using Java Spring Boot, Google Gemini AI, and Next.js

---

**Note:** Remember to replace `API_KEY_HERE` with your actual Google Gemini API key before running the application!
