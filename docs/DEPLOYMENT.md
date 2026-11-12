# Deployment & Network Setup Guide

This guide describes how to deploy and configure the **ESP32 Digital Clock & Smart Alarm System** frontend and firmware.

---

## 1. Local Development

### Prerequisites
- Node.js 18+ (tested with Node 22+)
- npm 9+

### Commands
```bash
# Install dependencies
npm install

# Start Vite dev server on local network
npm run dev

# Run TypeScript type check and production build
npm run build

# Preview production build locally
npm run preview
```

The web application binds to `0.0.0.0:5173`. You can open `http://localhost:5173` or your machine's LAN IP from your phone on the same Wi-Fi network.

---

## 2. Cloud Deployment (Vercel, Netlify, Cloudflare Pages)

Because the project is built as a pure static single-page application (React + TypeScript + Vite + Tailwind CSS), it can be deployed on any static hosting service with zero server overhead.

### Vercel Deployment
1. Connect your GitHub repository to Vercel.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Deploy!

### Netlify Deployment
Create `netlify.toml` in the repository root:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 3. Wi-Fi & Network Architecture

### Operating Mode 1: Access Point (SoftAP) Mode
- The ESP32 broadcasts its own private Wi-Fi network:
  - **SSID:** `DigitalClock-ESP32`
  - **Password:** `clock1234`
  - **Clock IP:** `192.168.4.1`
- Connect your phone, tablet, or laptop directly to `DigitalClock-ESP32`.
- Open the web application and enter `192.168.4.1` in the **ESP32 Device Connection** tab.
- This creates an isolated, zero-latency direct hardware control link.

### Operating Mode 2: Station (STA) Mode
- Configure your home/lab Wi-Fi network credentials in `firmware/esp32_smart_alarm/esp32_smart_alarm.ino`.
- The ESP32 joins your local router network and receives a DHCP IP address (e.g., `192.168.1.145`).
- Any device connected to your home Wi-Fi can access the control panel.

---

## 4. Understanding Browser Mixed-Content Security

When a web application is hosted on public HTTPS (e.g. `https://my-clock.vercel.app`), standard web browser security policies block insecure HTTP requests to local private RFC-1918 network addresses like `http://192.168.4.1`.

### Solutions:
1. **Simulation Mode (Standalone):** The application works completely without an ESP32 connected, maintaining all alarm timers, persistent storage, and wake-up game missions inside the browser!
2. **Local HTTP Access:** Serve the frontend locally or from an HTTP LAN endpoint when controlling physical hardware.
3. **PWA Installation:** Install the app as a Progressive Web App on your home screen for native-app behavior.
