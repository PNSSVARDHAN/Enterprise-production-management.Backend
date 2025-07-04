# 🚀 SMO Backend Setup Guide  

This guide explains how to install, configure, and run the **SMO Backend** on a new system.  

---

## 📌 Prerequisites  
Make sure you have the following installed on your system:  
- **Node.js** (LTS version) → [Download](https://nodejs.org/)  
- **Git** → [Download](https://git-scm.com/)  
- **PostgreSQL** (Database) → [Download](https://www.postgresql.org/)  

---

## 📥 Clone the Repository  
Open the terminal and run:  

```sh
git clone https://github.com/PNSSVARDHAN/SMO-Backend.git

```
Navigate into the project folder:

```sh
cd SMO-Backend
```
---

📦 Install Dependencies
Run the following command to install required dependencies:
```sh
npm install
```
---
🛠️ Configure Environment Variables
Create a .env file in the root directory and add your database configurations. Example:
```sh
PORT=5000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=5432
```
Replace your_db_user, your_db_password, and your_db_name with your actual PostgreSQL database credentials.

---

📊 Run Database Migrations
Before starting the server, ensure your database tables are set up:
```sh
npx sequelize-cli db:migrate
```
(Optional: If you need sample data, run seeders)
```sh
npx sequelize-cli db:seed:all
```
---
⚡ Start the Backend Server
To start the backend server, run:
```sh
npx nodemon src/index.js
```
After running this command, the backend API will be available at:
👉 http://localhost:5000

---
✅ Now your backend is set up and ready to use! 🚀
```sh

This file ensures proper documentation for setting up the **SMO Backend** on any system. 🚀
```
