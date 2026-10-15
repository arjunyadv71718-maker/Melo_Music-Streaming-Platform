# MELO - Online Music Streaming Platform

MELO is a role-based music platform: **listeners** stream music, **artists** upload and track songs, and **admins** approve content and manage users. Built with HTML/CSS/JavaScript, Spring Boot and MySQL.

Project Board, 3rd Semester - Galgotias University.

**Team:** Arjun Kumar, Ankita Pradhan, Abhishek Sisodiya, Manasvini Singh

## Features

- **Listener:** search and stream approved music, likes, playlists, follow artists, message artists
- **Artist:** upload songs with cover art, track approval status, view streams and likes, read fan messages
- **Admin:** manage users and roles, approve or reject music, change system settings
- Role-based login, responsive dark UI, music player that plays in one tab at a time

## Tech Stack

HTML5, CSS3, JavaScript | Java 17, Spring Boot 4.1.1, Spring Data JPA | MySQL | Maven

## Structure

```
frontend/   HTML pages, style.css, script.js, auth.js
backend/    Spring Boot project (pom.xml, mvnw, src/)
docs/       Presentation
```

## Run Locally

Requirements: JDK 17, MySQL, a web browser.

1. Create a database: `CREATE DATABASE melo_db;`
2. In `backend/src/main/resources/application.properties`, set your MySQL URL, username and password (do not commit real passwords).
3. Start the backend (API runs on `http://localhost:4971`):
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
4. Open `frontend/index.html` in your browser and register as a Listener or Artist.

Admin is not offered at registration; set a user's `role` to `admin` in the database to create one.

## Main API Endpoints

`/api/register`, `/api/login`, `/api/users`, `/api/music` (with `/stream`, `/cover`, `/status`, `/like`), `/api/settings`, `/api/fan-messages`
