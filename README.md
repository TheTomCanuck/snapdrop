 # Self-Hosted Snapdrop - LAN ONLY VERSION - DO NOT EXPOSE TO THE INTERNET 

A simple, self-hosted version of the classic Snapdrop, designed to run on your local network.

This fork preserves the original Snapdrop experience for private, local-only file sharing. It has been simplified to run without Docker or a reverse proxy like Nginx.

> **⚠️ CRITICAL SECURITY WARNING: LAN ONLY**  
> This server is designed for **Local Area Network (LAN) use only**. The code intentionally places **all** connecting clients into the same room. If you expose this server to the public internet, **any user on the internet will be able to see and send files to your devices.** This is a major security and privacy risk. **DO NOT EXPOSE THIS TO THE INTERNET.**

> ✅ Peer naming, icons, file and text transfer all work.  
> ✅ All devices on your LAN are automatically placed in the same "room" for easy discovery.  
> ✅ Requires no external services or complex setup.

---

## About the Original Snapdrop

Snapdrop is a local file sharing solution inspired by Apple's Airdrop. The original project was acquired, and the public website has changed. This repository maintains the classic experience for self-hosting.

---

## How It Works

This project consists of two main parts:
1.  **A Node.js WebSocket server** (`/server`): Manages peer connections and signaling.
2.  **A static web client** (`/client`): The user interface you interact with in your browser.

To get it running, you need to run the server and serve the client files separately.

---

## Local Setup and Running

### Prerequisites
- Node.js (which includes `npm` and `npx`)

### 1. Run the Backend Server

The server handles the WebSocket connections that allow devices to find each other.

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Start the server
npm start
```
The server will now be running and listening on port 3000.

### 2. Serve the Frontend Client

The client is a set of static HTML, CSS, and JavaScript files. You can use any simple web server to serve the `client` directory. A great, easy option is the `serve` package.

In a **new terminal window**, run the following command from the project's root directory:

```bash
# Serve the 'client' folder on port 8080
npx serve client -l 8080
```

### 3. Access Snapdrop

You can now access Snapdrop by opening your web browser and navigating to:

**http://localhost:8080**

To connect from other devices on your network, use your computer's local IP address, for example: `http://192.168.1.10:8080`. All devices that connect will see each other.

**Reminder:** This setup is for your private network. Do not configure your router (e.g., via port forwarding) to expose these ports to the internet.

#### ⚠️ Troubleshooting

If the client doesn't connect to the server (e.g., you don't see other devices), you may need to update the WebSocket URL in the client-side code. The client needs to connect to the server on port 3000.

-   **Find:** The JavaScript file in the `client/` directory that contains `new WebSocket(...)`.
-   **Change:** The connection URL to point to your server's hostname and port 3000, like this: `new WebSocket('ws://' + location.hostname + ':3000')`.

---

## Tech Stack

- Vanilla HTML5 / ES6 / CSS3 frontend
- WebRTC / WebSockets
- Node.js backend

---

## Advanced: Running with a Reverse Proxy (Nginx)

> **⚠️ CRITICAL SECURITY WARNING: DO NOT EXPOSE TO THE INTERNET**  
> This server is designed for **Local Area Network (LAN) use only**. The code intentionally places **all** connecting clients into a single, shared room.
> 
> If you expose this server to the public internet (e.g., through a router's port forwarding), **any user on the internet will be able to see your devices and attempt to send you files.** This is a severe privacy and security risk.
>
> The Nginx configuration below is provided **only** to show how to harden access *within* a private LAN. It is **not** for enabling public internet access.

The Node.js server is fully compatible with being run behind a reverse proxy like Nginx. This is an advanced setup useful for managing access on your local network.

You would need to:
1.  Run the Node.js backend server as described above (`cd server && npm start`). It will listen on `localhost:3000`.
2.  Configure Nginx to serve the static files from the `client` directory and proxy WebSocket requests to the Node.js server, while restricting access to your LAN.
3.  Update the client-side JavaScript to connect to the correct WebSocket path provided by your proxy.

### Example LAN-Only Nginx Configuration

Here is a sample Nginx configuration that serves the application while restricting access to devices on the `192.168.1.0/24` local network.

```nginx
server {
    listen 80;
    server_name snapdrop.local; # Or your server's IP

    # --- LAN Access Control ---
    # Allow traffic from your local network.
    # Adjust the IP range to match your network's subnet.
    allow 192.168.1.0/24;
    # Deny all other traffic
    deny all;
    # --------------------------

    # Serve the static client files
    location / {
        root /path/to/your/snapdrop/client;
        try_files $uri /index.html;
    }

    # Proxy WebSocket requests to the Node.js backend
    location /ws/ {
        # Note: The same access control from the server block applies here.
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

With this Nginx config, you would then need to find the `new WebSocket(...)` call in the client's JavaScript and point it to `ws://your-domain.com/ws/`.
