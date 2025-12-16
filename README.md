# Pharmacy Management System (PMS)

A comprehensive web-based pharmacy management system built with React and Node.js/Express.

## Features

- **User Management & Authentication**
  - Role-based access control (Admin, Pharmacist, Staff)
  - JWT authentication
  - Secure password hashing with bcrypt

- **Drug & Inventory Management**
  - Add/edit/delete medicines
  - Batch tracking with expiry dates
  - Low-stock alerts
  - Automatic stock updates on sales

- **Prescription Management**
  - Record and manage prescriptions
  - Validate prescription-only drugs
  - Link prescriptions to sales

- **Sales & Billing Module**
  - Point-of-sale (POS) interface
  - Auto-calculate totals and taxes
  - Payment tracking (cash, card, mobile money)
  - Receipt generation

- **Supplier & Purchase Management**
  - Supplier profiles
  - Purchase orders
  - Stock-in management
  - Invoice tracking

- **Reporting & Analytics**
  - Daily/weekly/monthly sales reports
  - Inventory turnover
  - Expiry and wastage reports
  - Dashboard statistics

## Tech Stack

### Backend
- Node.js & Express
- PostgreSQL
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React 18
- Material-UI (MUI)
- React Router
- Axios for API calls

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd "Pharmacy Management System"
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Setup Database**
   - Create a PostgreSQL database named `pharmacy_db` (or update the name in `.env`)
   - Update `backend/.env` with your database credentials:
     ```env
     PORT=5000
     NODE_ENV=development
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=pharmacy_db
     DB_USER=postgres
     DB_PASSWORD=your_password
     JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
     JWT_EXPIRE=7d
     ```

4. **Start the application**
   ```bash
   # Start both backend and frontend
   npm run dev

   # Or start separately:
   npm run server  # Backend on port 5000
   npm run client  # Frontend on port 3000
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Default Login Credentials
- Email: `admin@pms.com`
- Password: `admin123`

## Project Structure

```
Pharmacy Management System/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── initDb.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── medicineController.js
│   │   ├── saleController.js
│   │   └── ...
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── medicines.js
│   │   └── ...
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

### Medicines
- `GET /api/medicines` - Get all medicines
- `POST /api/medicines` - Create medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

### Sales
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/expiry` - Expiry report

## Development

The database schema is automatically initialized when the server starts. Tables are created if they don't exist, and a default admin user is created.

## License

This project is for educational purposes.

