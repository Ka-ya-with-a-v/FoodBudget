# FoodBudget.sg 🍽️�

A comprehensive web application designed to help Singaporeans manage food expenses through real-time price tracking, budget meal planning, and smart grocery optimization.

**Demo Video:** [Watch on YouTube](https://youtu.be/-kC61NQ9_Ks)

---

## 📋 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [Team](#team)
- [Known Issues](#known-issues)
- [Documentation](#documentation)

---

## 🎯 About the Project

**FoodBudget.sg** addresses the challenge of rising food prices in Singapore by providing users with tools to:
- Track food price inflation trends using CPI data
- Generate personalized budget meal plans
- Optimize grocery shopping lists
- Find cheaper hawker meal alternatives nearby

**Target Users:** Students, young working adults, and budget-conscious households seeking affordable, healthy meal options.

---

## ✨ Features

### 1. 📊 Food Price Inflation Dashboard
- Visualize historical food price trends using Consumer Price Index (CPI) data
- Filter by time periods and food categories
- Search specific food items and compare prices
- Interactive line charts with exact SGD values

### 2. 🍱 Budget Meal Planner
- Generate personalized meal plans based on budget constraints
- Set dietary preferences (Halal, Vegetarian, calorie limits)
- View nutritional information and total costs
- Save and edit meal plans to your profile

### 3. 🛒 Grocery Basket Planner
- Search and select meals from a curated dataset
- Specify number of servings
- Auto-generate consolidated shopping lists
- View estimated costs and download lists

### 4. 🏪 Smart Hawker Swap
- Enter your location to find nearby hawker stalls
- Search for specific dishes
- Get recommendations for cheaper alternatives within 3km
- View estimated savings and stall details

### 5. 👤 User Authentication & Profile
- Secure login and registration
- Save meal plans and grocery lists
- Manage dietary preferences and budget settings
- Track saved items and history

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js
- **Styling:** CSS
- **Build Tool:** Vite

### Backend
- **Framework:** Spring Boot 3.2.5
- **Language:** Java 21
- **API Architecture:** RESTful APIs

### Database & Data Storage
- **Primary:** Supabase (PostgreSQL)
- **Fallback:** CSV files (for data reliability)
- **Data Sources:** data.gov.sg (CPI data), NEA datasets

### Development Tools
- **Version Control:** Git
- **Package Manager (Frontend):** npm

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js** (v16 or higher)
- **Java** (JDK 21)
- **Maven** (included via Maven Wrapper)

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/your-username/foodbudget-sg.git
   cd foodbudget-sg
```

2. **Install Frontend Dependencies**
```bash
   cd Frontend
   npm install
```

3. **Backend Setup**
   
   The backend uses Maven Wrapper, so no additional Maven installation is required.
   
   Navigate to the Backend folder:
```bash
   cd ../Backend
```

### Running the Application

#### Start the Backend Server

From the `Backend` folder:
```bash
./mvnw spring-boot:run
```

The backend will start on **http://localhost:8080**

#### Start the Frontend Development Server

Open a new terminal, navigate to the `Frontend` folder:
```bash
cd Frontend
npm run dev
```

The frontend will start on **http://localhost:5173**

#### Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 📖 Usage Guide

### Getting Started

1. **Create an Account**
   - Click "Sign Up" on the homepage
   - Enter your email and password
   - Set your dietary preferences and budget

2. **Explore the Dashboard**
   - Navigate to the **Inflation Dashboard** to view price trends
   - Select time ranges and food categories to analyze

3. **Generate Meal Plans**
   - Go to **Budget Meal Planner**
   - Set your preferences (budget, calories, dietary restrictions)
   - Click "Generate Meal Plan" to receive personalized suggestions

4. **Create Shopping Lists**
   - Visit **Grocery Basket Planner**
   - Search and select meals
   - Specify number of servings
   - Download your consolidated shopping list

5. **Find Cheaper Hawker Options**
   - Access **Smart Hawker Swap**
   - Enter your address
   - Search for dishes to find affordable alternatives nearby

### Key Navigation

- **Main Menu:** Access all features from the top navigation bar
- **Profile:** View and manage your saved items in the top-right corner
- **Return Button:** Available on all pages to navigate back

---

## 📁 Project Structure
```
foodbudget-sg/
├── Frontend/                # React frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── Backend/                 # Spring Boot backend application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   └── resources/
│   │   └── test/
│   ├── pom.xml
│   └── mvnw
│
└── README.md
```

---

## 👥 Team

**Group 71**

- Aiyinikunnathu Jigeendran Aiswarya
- Lee Yun-Tung
- Thaluri Kavya
- Li Shuhui
- Serena, Dai Yi

---

## ⚠️ Known Issues & Limitations

### Current Status
This is a **prototype** version of FoodBudget.sg. The following limitations apply:

1. **Database Connectivity**
   - Intermittent Supabase connection issues may occur due to connection limits
   - CSV fallback ensures continued functionality during outages

2. **Deployment**
   - Currently runs on localhost for development
   - Production deployment is planned for future phases

3. **Data Updates**
   - CPI and hawker data require periodic manual updates
   - Automated data refresh pipeline is under development

4. **Language Support**
   - English only in current version
   - Multi-language support planned for future releases

5. **Browser Compatibility**
   - Optimized for modern browsers (Chrome, Firefox, Safari, Edge)
   - Older browser versions may experience compatibility issues

---

## 📚 Documentation

For detailed technical specifications and requirements, please refer to:
- **Software Requirements Specification (SRS)** - Available in the repository
- **Demo Video** - [Watch on YouTube](https://youtu.be/-kC61NQ9_Ks)

---

## 🔧 Troubleshooting

### Backend won't start
- Ensure Java 21 is installed: `java -version`
- Check if port 8080 is available
- Verify Maven Wrapper has execute permissions: `chmod +x mvnw`

### Frontend won't start
- Verify Node.js is installed: `node -v`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Database connection errors
- The application will automatically fall back to CSV data
- Check Backend console for detailed error messages

### API not responding
- Ensure both frontend and backend servers are running
- Verify backend is accessible at http://localhost:8080
- Check browser console for CORS or network errors

---

##  License

This project is developed as part of an academic assignment by Nanyang Technological University.

---

##  Acknowledgments

- **Data Sources:** data.gov.sg, National Environment Agency (NEA)
- **Frameworks:** React.js, Spring Boot, Supabase
- Special thanks to our instructors and peers for their guidance


---

**Made with **love** by Group 71**
