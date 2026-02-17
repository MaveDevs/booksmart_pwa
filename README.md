📘 BookSmart PWA — PWA Deployment with Docker & CI/CD

Materia: Desarrollo Web Profesional
Institución: Universidad Tecnológica de Tijuana
Docente: Mike Cardona (@mikecardona076)
Alumno: Isaac Abdiel Gonzalez Gutierrez

📌 Objetivo

Comprender la arquitectura técnica de una Progressive Web App (PWA) e implementar un flujo profesional de despliegue utilizando:

Angular 21 + TypeScript

Bun como runtime de desarrollo

Docker multi-stage con Nginx

CI/CD con GitHub Actions

Hosting HTTPS con GitHub Pages

🧠 Parte 1 — Fundamentos Teóricos de una PWA

📄 Web App Manifest (manifest.webmanifest)

El Web App Manifest es un archivo JSON que permite que una aplicación web se comporte como una aplicación nativa instalable.

⚙️ Service Workers

Un Service Worker es un script que actúa como un proxy de red entre la aplicación y el navegador.

🔄 Ciclo de Vida

Installation
Se cachean recursos esenciales.

Activation
Toma control de la aplicación.

Fetch
Intercepta peticiones HTTP.