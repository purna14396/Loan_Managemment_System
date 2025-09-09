
# 💰 Loan Management System 1

## 👨‍💻 Team Members:
- Golagana Vandana  
- Potu Purna Sai  
- Athikamsetti Janaki Ram  
- Aguru Sandeep  

---

## 🚀 Full Stack Setup Guide

### 📁 Project Structure:
```
LTIM_LMS_1_repo/
├── backend/       👉 Spring Boot (Java 21)
└── frontend/      👉 React
```

---

## 🔗 Clone the Repository
```bash
git clone https://github.com/Ft-Trumio/LTIM_LMS_1_repo.git
cd LTIM_LMS_1_repo
```

---

## 🔧 Prerequisites  
Ensure the following versions are installed:

- ✅ Java 21  
- ✅ Maven 3.8+  
- ✅ Node.js 18+  
- ✅ MySQL 8.x  

---

## 🔙 Backend Setup – Spring Boot

### ✅ Step 1: Navigate to the backend folder
```bash
cd backend
```

### ✅ Step 2: Configure the database  
Edit the file:
```
src/main/resources/application.properties
```

Paste the following config:
```properties
# Load secret properties
spring.config.import=optional:classpath:application-secret.properties

# =====================
# Server Configuration
# =====================
server.port=8081

# =====================
# CORS Configuration
# =====================
spring.mvc.cors.allowed-origins=http://localhost:3000
spring.main.allow-bean-definition-overriding=true

# =====================
# Database Configuration
# =====================
spring.datasource.url=jdbc:mysql://localhost:3306/lms_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

# =====================
# Hibernate Configuration
# =====================
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# =====================
# Application Info
# =====================
spring.application.name=backend

# =====================
# JWT Configuration
# =====================
jwt.secret=${JWT_SECRET}
jwt.expiration=${JWT_EXPIRATION}

# =====================
# Admin Secret
# =====================
app.admin.secret=${ADMIN_SECRET}
super.admin.key=${SUPER_ADMIN_KEY}

# === Gmail SMTP (no password here) ===
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.debug=false   # set to false after verifying

# pretty From name (works with SimpleMailMessage)
mail.from=SmartLendOfficial <your official Mail>

```

Then, create a new file for secrets:

#### 📁 `src/main/resources/application-secret.properties`
```properties
DB_USERNAME=root
DB_PASSWORD= your db pass

JWT_SECRET= jwt secret key
JWT_EXPIRATION=86400000

ADMIN_SECRET=admin secret key
super.admin.key= superadmin secret key

MAIL_USERNAME= official mail
MAIL_PASSWORD= mail app password

spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}

```

Make sure to include this secret file in your `application.properties`:
```properties
spring.config.import=application-secret.properties
```

### ✅ Step 3: Build and run the backend
```bash
mvn clean install
mvn spring-boot:run
```

🔗 **Backend running at:** [http://localhost:8081](http://localhost:8081)

---

## 🌐 Frontend Setup – React

### ✅ Step 1: Navigate to the frontend folder
```bash
cd ../frontend
```

### ✅ Step 2: Install project dependencies
```bash
npm install
```

### ✅ Step 3: Install additional packages
```bash
npm install react-toastify react-icons
```

### ✅ Step 4: Start the development server
```bash
npm start
```

🔗 **Frontend running at:** [http://localhost:3000](http://localhost:3000)

---


# Loan Management System – Features Summary

## Authentication & Security
- User Login & Registration (Admin / Customer)
- JWT Authentication & Authorization
- Role-based Dashboards (Admin / Customer)
- Protected Routes for Secure Access
- Admin Key Verification during Admin Signup
- Password Encryption with BCrypt
- Token Expiry & Refresh Handling

## Customer Features
- Profile Management (View & Update Details)
- Loan Application Module (Apply for Loans Online)
- My Loan Applications (View Application Status & History)
- EMI Calculator & EMI Tracking
- EMI Repayment
- Automated Email Notifications (Receipts and NOC)
- CIBIL Score (Credit Score) Generation & Display
- Contact Us / Support


## Admin Features
- Dashboard with Role-based Access
- Manage Users (View Customers, Full Details, Manage Accounts)
- Manage Loans (Approve / Reject Applications)
- View & Track EMI Payments
- Download / Export Reports (PDF via jsPDF, React Charts)


## Finance & Transparency Tools
- EMI & Loan Repayment Calculator
- Loan Comparison (helps customers plan before applying)
- Creditworthiness Insights (based on generated CIBIL score)

## Notifications & Communication
- Email Notifications (Loan Closed, NOC, Receipts for EMI Payment, EMI Due Reminders)
- Automated Reminders for Payments

## Technical & System Features
- Clean Modular Code Structure (Frontend & Backend Separation)
- React (Frontend) + Spring Boot (Backend) + MySQL (Database)
- REST APIs 
- Form Validation & Toast Notifications (Frontend UX)
- Normalized Database Schema
- Secure Authentication with JWT + BCrypt
- Testing with JUnit, Mockito (Backend) & Jest (Frontend)

This allows users to plan finances better before applying for any loan, enhancing the platform's usability and transparency.

---


