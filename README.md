# Self-Hosted Snapdrop (Fixed + Nginx-Compatible)

This is a **self-hosted fork of Snapdrop**, fully working behind **Nginx** with proper:
- Static frontend served from `/snapdrop/`
- WebSocket backend reverse-proxied via `/ws/` and `/snapdrop/server/webrtc`
- Peer discovery working on LAN (even with NAT/private IPs)

> ✅ Peer naming, icons, file and text transfer all work  
> ✅ Requires no external services — local-only
> ❌ Docker untested, likely non-functional

---

## About the Original Snapdrop

[Snapdrop](https://snapdrop.net): local file sharing in your browser. Inspired by Apple's Airdrop.

Snapdrop was acquired by LimeWire, and [snapdrop.net](https://snapdrop.net) now points to their updated hosted version.

This repo preserves and adapts the **classic Snapdrop** experience for private LAN use.

---

## Tech Stack

- Vanilla HTML5 / ES6 / CSS3 frontend
- WebRTC / WebSockets
- Node.js backend (manual WebSocket upgrade mode)
- Nginx proxy with local peer grouping

