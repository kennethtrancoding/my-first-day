[**myfirstday.kennethtrancoding.com**]

# My First Day — Mentor-Student Connection Platform

My First Day is a web application designed to connect new or transferring students with student mentors and teachers before the first day of school. The primary goal is to help students ask questions, receive guidance, and familiarize themselves with the school community in a low-stress environment.

# Overview

The application provides two user interfaces:

Student Page: Allows new students to register, see available/matched mentors, and send connection messages.
Mentor Page: Allows student mentors and teachers to manage their profiles, view assigned students, and respond to incoming questions and requests.

Data: Data is currently not stored anywhere and deleted when the session ends for this prototype.

# Features

Routing: Manages page transitions via react-router-dom.

# Student Interface

Profile Creation: Basic profile setup (name, grade, interests).
Mentor Directory: View a list of available mentors.
Messaging: Send and receive messages with connected mentors.
Club Directory: View a list of school clubs and message advisors.
Map: Interactive map of the school with student periods and amenities labeled.
Resource Library: Collection of resources such as the student handbook and course list.

# Mentor Interface

Registration: Register as a mentor (teacher or student mentor).
Profile Management: Set an availability status and short bio.
Request Management: View and approve incoming student requests.
Messaging: Send and receive messages with connected students.
Club Directory: View a list of school clubs and message advisors.
Map: Interactive map of the school with student periods and amenities labeled.
Resource Library: Collection of resources such as the student handbook and course list.

## Code Organization

The codebase is organized around feature areas so it is easier to expand beyond the student experience.

```
src/
├─ features/
│  ├─ student/
│  │  ├─ components/
│  │  └─ pages/
│  ├─ mentor/
│  │  ├─ components/
│  │  └─ pages/
│  └─ shared/
│     └─ pages/map/
├─ pages/Landing/
└─ components/Transition/
```

## Technical Stack

Frontend: React (Vite)
Routing: React Router
Styling: Tailwind CSS
Storage: Local Storage
Deployment: GitHub Pages

## Future Extensions

The following are planned features for subsequent versions:

Cloud Database Integration: Implement a persistent cloud database for multi-user functionality.
Authentication: Implement authentication with role-based access control for students and mentors.
Real-Time Chat: Upgrade the messaging system with WebSockets or a real-time database to enable live chat.
Notifications: Add push notifications or email summaries for new messages and connection requests.

## Author

Created by Kenneth Tran for the 2025 Congressional App Challenge.
