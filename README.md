# Django URL Shortener

A simple and efficient **URL Shortener** built with **Django**.  
This project allows users to shorten long URLs into compact, easy-to-share links - similar to Bitly or TinyURL - with features like click tracking and expiration dates.

---
## Project Walkthrough:

### Shorten a Long URL:
![Project Demo](https://raw.githubusercontent.com/yashwanth2706/django-url-shortner/main/walkthrough/django_urlshortener.gif)

## 🚀 Features

- Shorten any long URL into a unique short link  
- Redirect to the original URL when visiting the short link  
- Track number of clicks per URL  
- Optional URL expiration date  
- Simple web interface for creating and managing short URLs  
- REST API for programmatic access  

---

## 🛠️ Tech Stack

- **Backend:** Django (Python)  
- **Database:** SQLite / PostgreSQL  
- **Frontend:** HTML, CSS, Bootstrap, JS  
- **API:** Django REST Framework

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/django-url-shortener.git
cd django-url-shortener
# create a virtual envirornment
python3 -m venv .venv
# Activate virtual envirornment
source .venv/bin/activate
# install dependencies
pip install -r requirements.txt
# Run the project
python3 manage.py runserver
# Visit the project locally (Paste below in browser)
http://localhost:8000
