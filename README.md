
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
server.port=8081
spring.datasource.url=jdbc:mysql://localhost:3306/lms_db
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
app.admin.secret=${ADMIN_SECRET}
jwt.secret=${JWT_SECRET}
jwt.expiration=${JWT_EXPIRATION}
```

Then, create a new file for secrets:

#### 📁 `src/main/resources/application-secret.properties`
```properties
DB_USERNAME=root
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=3600000  # (e.g., 1 hour in milliseconds)

ADMIN_SECRET=supersecretkey
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

## 🛠️ Project Features Summary

- ✅ User Login & Registration (Admin / Customer)  
- ✅ JWT Authentication  
- ✅ Role-based Dashboards  
- ✅ Protected Routes  
- ✅ Form Validation & Toast Notifications  
- ✅ Admin Key Verification  
- ✅ Clean Modular Code Structure:

---

## 🖼️ Application UI Screenshots

### 🏠 1. Home Page
![Home](https://github.com/user-attachments/assets/5a2c0279-deaa-45b9-9c69-1756cdad3eae)

### 💼 2. Loan Services Section
![Loan Services](https://github.com/user-attachments/assets/98ecfe4e-58f7-409e-853e-23c955696a4f)

### 📬 3. Contact Form Section
![Contact Form](https://github.com/user-attachments/assets/8cf46a84-8969-4a40-a633-980b859ed698)

### 📝 4. Registration Forms

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/97ae478c-d83d-42cf-95d6-c40e8f6ebbb4" width="100%"/></td>
    <td><img src="https://github.com/user-attachments/assets/d182a273-a8bd-499b-b5e2-7efe4005234c" width="100%"/></td>
  </tr>
</table>

### 🔐 5. Login Page

- The login interface allows Admin and Customer users to authenticate. On successful login, a JWT token is issued and used for all secured API access.
- Users can securely reset their password by providing their username and new credentials. Backend validations are in place to prevent mismatches or unauthorized resets.

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/c5303ef7-6635-4b97-9ed0-5371d115517c" width="100%"/></td>
    <td><img src="https://github.com/user-attachments/assets/17ef2d0b-beaa-4f80-9198-25fa3129f6e1" width="100%"/></td>
  </tr>
</table>

### 🔐 6. Emi Calculator Feature

The Loan Management System includes a built-in **EMI (Equated Monthly Installment) Calculator** accessible from the home page. Users can calculate estimated monthly payments based on:
- Selected **loan type**
- Desired **loan amount**
- **Loan duration** in months or years

It dynamically shows:
- 💸 Monthly EMI
- 📊 Interest rate based on loan type
- 📈 Total payable amount and principal breakdown

![Emi_Calculator](https://github.com/user-attachments/assets/762aa001-d409-4b99-b594-12ec64e826d0)

### 🔐 7. Admin Dashboard

The Admin dashboard offers full control over the system, allowing administrative users to manage all aspects of the loan platform.

- The Admin dashboard offers full control over the system, allowing administrative users to manage all aspects of the loan platform.
- Dashboard – Overview with loan statistics and system metrics (coming soon)
- User Management – Manage all registered users
- Loan Applications – Approve, reject, or delete customer loan applications
- Interest & Penalty Config – Define interest rates and penalty settings
- Loan Type Configuration – Manage available loan types
- Reports & Analytics – Visual reports on loan activity (coming soon)
- My Profile – View and update admin details, change password
- Contact Us – Raise support or service-related queries (coming soon)

<img width="100%" alt="AdminDashboard" src="https://github.com/user-attachments/assets/7a04eeeb-7aec-46eb-b11e-f44d905120d8" />


### 👤 8. Customer Dashboard

The Customer dashboard is streamlined for individual users to apply for loans, track their progress, and manage payments.

- Dashboard – Overview with loan statistics and system metrics (coming soon)
- User Management – Manage all registered users
- Loan Applications – Approve, reject, or delete customer loan applications
- Interest & Penalty Config – Define interest rates and penalty settings
- Loan Type Configuration – Manage available loan types
- Reports & Analytics – Visual reports on loan activity (coming soon)
- My Profile – View and update admin details, change password
- Contact Us – Raise support or service-related queries (coming soon)

<img width="100%" alt="CustomerDashboard" src="https://github.com/user-attachments/assets/0eda8297-7c05-40d4-888b-0b31e81d7d9b" />

This allows users to plan finances better before applying for any loan, enhancing the platform's usability and transparency.

---


