# TransDiesel Equipment Management System (EMS)

Welcome to the **TransDiesel Equipment Management System (EMS)** repository. 

This is a full-stack web application built to streamline and automate the management of heavy equipment, service requests, preventive maintenance (PM) schedules, annual maintenance contracts (AMC), and invoicing.

## 🚀 Features

- **Equipment Tracking:** Manage detailed records of all equipment and machinery.
- **Service Requests & Orders:** Create, assign, and track service tasks through to completion.
- **Maintenance Scheduling:** Keep track of Preventive Maintenance (PM) and Annual Maintenance Contracts (AMC).
- **Invoicing:** Generate and manage service invoices seamlessly.
- **Reporting:** Export data to PDF and Excel formats.
- **Modern UI:** Built with React and TailwindCSS for a responsive and intuitive user experience.

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite 5
- TailwindCSS 3
- React Router DOM v6
- Axios

**Backend:**
- Node.js
- Express 4
- PostgreSQL 14+ (via `pg`)

**Utilities:**
- jsPDF & jsPDF-AutoTable (PDF Export)
- SheetJS (xlsx) (Excel Export)

## 📋 Installation & Setup

For detailed instructions on how to install dependencies, set up the PostgreSQL database, and run both the frontend and backend servers locally, please refer to the [Setup Guide](SETUP.md).

## 📄 Database Schema

The database schema is provided in `schema.sql`. It includes tables for:
- Equipment
- Service Requests
- Service Orders
- Invoices

Refer to the Setup Guide for instructions on how to import this schema into your local PostgreSQL instance.

---
*Built with ❤️ for TransDiesel operations.*
