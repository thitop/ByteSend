# DropCode — P2P File Transfer Web App

## 1. Project Overview

**DropCode** is a responsive web application for transferring files directly between two devices using a short connection code.

The main concept is:

> **Send files directly. No upload. No cloud storage.**

The server is used only as a **signaling server** to help two browsers establish a WebRTC connection. File data should not be uploaded to or permanently stored on the server.

### Core Flow

```text
Sender Browser
      │
      │ Create Room
      ▼
Signaling Server
      │
      │ Exchange WebRTC signaling data
      ▼
Receiver Browser
      │
      └──────── WebRTC P2P ────────┐
                                   │
Sender Browser ═══ File Data ═══ Receiver Browser
```

---

# 2. Main Goals

- Transfer files between two devices using a short code.
- Do not store transferred files on the server.
- Use WebRTC DataChannel for file transfer.
- Use WebSocket for signaling.
- Support desktop and mobile browsers.
- Provide a simple and modern UI.
- Show real-time transfer progress, speed, file size, and ETA.
- Support multiple files.
- Automatically expire unused rooms.
- Handle connection failures gracefully.

---

# 3. Target Platforms

## Desktop

Support modern:

- Chrome
- Edge
- Firefox
- Safari

Recommended screen sizes:

- 1280px+
- 1440px+
- 1920px+

## Mobile

The website must be responsive and usable on:

- iPhone Safari
- Android Chrome
- Android Firefox
- Mobile Chrome-based browsers

Recommended breakpoints:

```text
Mobile:  < 640px
Tablet:  640px - 1024px
Desktop: > 1024px
```

The mobile experience is not an afterthought. All major actions must remain usable with touch input.

---

# 4. Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React

## Realtime / Networking

- WebSocket
- WebRTC
- WebRTC DataChannel

## Backend

- Node.js
- Fastify or Express
- WebSocket server

## Optional

- QR Code generation
- LocalStorage for client-side transfer history
- Service Worker / PWA support

---

# 5. Architecture

## Frontend

```text
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   └── file-transfer-card.tsx
│   │
│   ├── file/
│   │   ├── FileDropzone.tsx
│   │   ├── FileList.tsx
│   │   └── FileItem.tsx
│   │
│   ├── room/
│   │   ├── RoomCode.tsx
│   │   ├── QRCode.tsx
│   │   └── ConnectionStatus.tsx
│   │
│   └── transfer/
│       ├── TransferProgress.tsx
│       ├── TransferStats.tsx
│       └── TransferComplete.tsx
│
├── pages/
│   ├── Home.tsx
│   ├── Send.tsx
│   ├── Receive.tsx
│   └── Transfer.tsx
│
├── hooks/
│   ├── useWebSocket.ts
│   ├── useWebRTC.ts
│   └── useFileTransfer.ts
│
├── services/
│   ├── signaling.ts
│   ├── webrtc.ts
│   └── fileTransfer.ts
│
├── types/
│   ├── room.ts
│   ├── transfer.ts
│   └── signaling.ts
│
└── App.tsx
```

## Backend

```text
server/
├── src/
│   ├── server.ts
│   ├── websocket.ts
│   ├── rooms.ts
│   ├── signaling.ts
│   └── types.ts
│
└── package.json
```

---

# 6. Server Responsibilities

The server should **never receive the actual file data**.

The server is responsible for:

1. Creating temporary rooms.
2. Generating secure room codes.
3. Allowing a receiver to join a room.
4. Relaying WebRTC signaling messages.
5. Managing connection state.
6. Expiring inactive rooms.
7. Removing disconnected users.

## Server must NOT

- Store uploaded files.
- Store file contents.
- Store file previews.
- Store permanent transfer history.
- Act as a file download server.

---

# 7. Room System

A room contains:

```ts
{
  roomId: string,
  sender: WebSocket,
  receiver?: WebSocket,
  createdAt: number,
  expiresAt: number
}
```

Example:

```text
Room Code: 8K4P2M
Status: Waiting
Expires: 09:42
```

## Room Rules

- Code length: 6 characters.
- Use uppercase letters and numbers.
- Avoid ambiguous characters such as `O/0` and `I/1`.
- Maximum 2 participants.
- Room automatically expires.
- Destroy room after transfer completion.
- Destroy room when the sender disconnects.

Example code:

```text
8K4P2M
7F92KD
Q5N8XA
```

---

# 8. WebRTC Architecture

The actual file transfer should use:

```text
WebRTC DataChannel
```

Connection flow:

```text
Sender
  │
  │ Create Offer
  ▼
Signaling Server
  │
  ▼
Receiver
  │
  │ Create Answer
  ▼
Signaling Server
  │
  ▼
Sender
  │
  ▼
ICE Candidate Exchange
  │
  ▼
WebRTC Connection
  │
  ▼
DataChannel Open
```

After the connection is established:

```text
Sender ═════════════════ Receiver
             P2P
```

---

# 9. File Transfer

Do not send very large files as one giant DataChannel message.

Files should be split into chunks.

Example:

```text
1 GB File

Chunk 1
Chunk 2
Chunk 3
...
Chunk N
```

Recommended initial chunk size:

```text
256 KB - 1 MB
```

The exact size should be tested and adjusted based on browser behavior.

## Transfer Metadata

Before sending file chunks, send metadata such as:

```ts
{
  type: "file-start",
  fileId: string,
  name: string,
  size: number,
  mimeType: string,
  totalChunks: number
}
```

Then:

```text
file-start
      ↓
chunk
      ↓
chunk
      ↓
chunk
      ↓
file-complete
```

---

# 10. Multiple Files

The sender can select multiple files.

Example:

```text
Files

📄 presentation.pdf     24 MB
🖼️ image.png             8 MB
📦 project.zip          1.2 GB

Total: 1.23 GB
```

Files should be transferred sequentially in the MVP.

---

# 11. Transfer Progress

The UI should show:

- Overall progress
- Current file
- Current file progress
- Transfer speed
- Estimated remaining time
- Total transferred
- Total size
- Number of files
- Connection status

Example:

```text
Sending

project.zip

██████████████████░░ 82%

982 MB / 1.2 GB

Speed       48.2 MB/s
Remaining   5 sec
Files       3
```

---

# 12. UI / UX Structure

## Page 1 — Home

The homepage should immediately communicate the concept.

```text
DropCode

Send files directly.
No upload. No cloud storage.

┌─────────────────────────────┐
│                             │
│      Drop files here        │
│                             │
│      or select files        │
│                             │
└─────────────────────────────┘

              OR

       Receive with a code

       [ Enter Code ]

          [ Receive ]
```

Primary actions:

- Send Files
- Receive Files

---

# 13. Send Page

```text
Send Files

┌─────────────────────────────┐
│                             │
│      Drop files here        │
│                             │
│       Browse Files          │
│                             │
└─────────────────────────────┘

Selected Files

photo.zip       1.2 GB
image.png       8 MB

Total: 1.21 GB

[ Create Transfer ]
```

After creating the room:

```text
Your Transfer Code

     8 K 4 P 2 M

     [ Copy Code ]

       [ QR Code ]

Waiting for receiver...

● Waiting for connection
```

---

# 14. Receive Page

```text
Receive Files

Enter transfer code

┌─────────────────────┐
│       8K4P2M        │
└─────────────────────┘

[ Receive ]
```

After joining:

```text
Connecting...

8K4P2M

● Connecting to sender
```

---

# 15. Transfer Page

The provided `FileTransferCard` design can be used as the foundation for the transfer screen.

It already contains:

- Source device
- Destination device
- Progress
- Transfer rate
- Estimated time
- File types
- Total file size
- Cancel action
- Pause/Resume concept
- Security indicator

The original component is structured as a transfer-status card rather than a homepage, so it should be used specifically for the **active transfer state**.

Recommended title:

```text
File Transfer
```

Instead of:

```text
Smart WiFi Transfer
```

The connection indicator should describe the WebRTC connection rather than implying that the transfer only works over Wi-Fi.

---

# 16. Transfer Complete

```text
✓ Transfer Complete

3 files transferred

Total Size
1.23 GB

Transfer Time
26 seconds

[ Download Files ]

[ New Transfer ]
```

For received files, trigger the browser download/save flow.

---

# 17. Mobile UI

The mobile version should use a single-column layout.

## Mobile Home

```text
┌──────────────────────┐
│      DropCode        │
│                      │
│ Send files directly  │
│ No upload required   │
│                      │
│ ┌──────────────────┐ │
│ │                  │ │
│ │  Drop / Select   │ │
│ │     Files        │ │
│ │                  │ │
│ └──────────────────┘ │
│                      │
│       ─ OR ─         │
│                      │
│   Receive with code  │
│                      │
│ ┌──────────────────┐ │
│ │      8K4P2M      │ │
│ └──────────────────┘ │
│                      │
│      [ Receive ]     │
└──────────────────────┘
```

## Mobile Rules

- No horizontal scrolling.
- Buttons should be touch-friendly.
- Minimum touch target: approximately 44px.
- File cards should stack vertically.
- Transfer details should use a 1-column layout.
- Code input should use large typography.
- QR code should fit within the viewport.
- Progress information should remain readable without zooming.
- Avoid hover-only interactions.
- Support portrait orientation.
- Support landscape orientation where practical.

---

# 18. Responsive Transfer Card

Desktop:

```text
┌──────────────────────────────────────┐
│              File Transfer           │
│                                      │
│ Laptop ────────●──────── Laptop      │
│                                      │
│ ███████████████████░░░ 82%           │
│                                      │
│ Speed        ETA        Size         │
│ 48 MB/s      5 sec      1.2 GB       │
│                                      │
│ [ Cancel ]        [ Pause ]          │
└──────────────────────────────────────┘
```

Mobile:

```text
┌──────────────────────┐
│    File Transfer     │
│                      │
│      💻  →  📱      │
│                      │
│ ███████████████░░ 82%│
│                      │
│ 48 MB/s              │
│ 5 sec remaining      │
│ 1.2 GB                │
│                      │
│ [      Pause       ] │
│ [      Cancel      ] │
└──────────────────────┘
```

---

# 19. Visual Design

Recommended visual direction:

## Style

- Modern
- Minimal
- Clean
- Developer-focused
- Premium SaaS
- Subtle glass / soft surfaces
- Strong typography
- Minimal gradients
- Clear status indicators

Avoid:

- Excessive gradients
- Overly colorful UI
- Too many cards
- Excessive animations
- Large decorative illustrations that reduce usable space

## Suggested color system

Use the Tailwind/shadcn theme system instead of hardcoding colors.

Primary accent can be used for:

- Connection status
- Progress
- Primary buttons
- Active states
- Room code emphasis

Success state:

```text
Connected
Transfer Complete
```

Warning state:

```text
Waiting
Connecting
```

Error state:

```text
Connection Failed
Transfer Failed
```

---

# 20. Animation

Use subtle animations for:

- Connecting dots
- Progress changes
- File upload/drop zone
- Room creation
- Connection established
- Transfer complete

Do not animate the entire page continuously.

Animations should communicate state rather than exist only for decoration.

---

# 21. Security

## Room Security

Use cryptographically secure random generation for room codes.

Do not use predictable sequential IDs.

## WebRTC

Use HTTPS in production.

Use secure WebSocket:

```text
wss://
```

instead of:

```text
ws://
```

## Privacy Principle

The application should clearly communicate:

> Files are transferred directly between devices. The signaling server does not store your files.

Do not claim that the system is completely anonymous or completely secure unless the implementation actually provides those guarantees.

---

# 22. Error Handling

Handle:

### Receiver not found

```text
Waiting for receiver...
```

### Invalid code

```text
Transfer code not found.
The code may have expired.
```

### Room expired

```text
This transfer room has expired.
Create a new transfer.
```

### Connection failed

```text
Unable to establish a direct connection.

[ Retry ]
```

### Transfer interrupted

```text
Transfer interrupted.

Connection lost.

[ Resume ]
[ Cancel ]
```

### Unsupported browser

```text
Your browser does not support the required
features for direct file transfer.

Please use a modern version of Chrome,
Edge, Firefox, or Safari.
```

---

# 23. MVP Scope

The first working version should contain only:

```text
1. Home
2. Send
3. Receive
4. Room Code
5. WebSocket Signaling
6. WebRTC Connection
7. Single File Transfer
8. Progress
9. Transfer Speed
10. Transfer Complete
11. Cancel
12. Room Expiration
13. Responsive Mobile UI
```

Do not start with:

- Authentication
- Database
- User accounts
- Cloud storage
- Transfer history
- Social features
- File sharing links

These can be added later if needed.

---

# 24. Development Roadmap

## Phase 1 — UI

- Setup React + TypeScript + Vite
- Setup Tailwind
- Setup shadcn/ui
- Create responsive layout
- Create Home
- Create Send
- Create Receive
- Create Transfer
- Create Complete state

## Phase 2 — Signaling

- Create Node.js server
- WebSocket connection
- Create room
- Generate room code
- Join room
- Room expiration
- Disconnect handling

## Phase 3 — WebRTC

- Create RTCPeerConnection
- Create DataChannel
- SDP Offer
- SDP Answer
- ICE Candidate exchange
- Connection state handling

## Phase 4 — File Transfer

- File selection
- File metadata
- Chunking
- DataChannel transfer
- Chunk reconstruction
- Blob creation
- Browser download

## Phase 5 — Transfer UX

- Progress
- Speed calculation
- ETA
- Multiple files
- Cancel
- Error states
- Connection status

## Phase 6 — Mobile

- Responsive layout
- Touch interactions
- Mobile file picker
- QR code
- Mobile transfer UI
- Portrait testing
- Safari testing
- Android Chrome testing

## Phase 7 — Polish

- Animations
- Loading states
- Empty states
- Accessibility
- Performance optimization
- Error handling
- Production deployment

---

# 25. Future Features

Possible V2/V3 features:

- QR Code pairing
- Password protected rooms
- Resume interrupted transfers
- Multiple simultaneous transfers
- Local Network discovery
- PWA installation
- Transfer history using LocalStorage
- File preview
- Drag & drop folders where browser support allows
- Desktop app using Tauri
- Optional TURN server for difficult NAT environments

---

# 26. Deployment

## Frontend

Possible platforms:

- Vercel
- Netlify
- Cloudflare Pages

## Signaling Server

Possible platforms:

- Railway
- Render
- Fly.io
- VPS

The frontend and signaling server should use HTTPS/WSS in production.

Example:

```text
https://dropcode.example.com
        │
        │ WebSocket
        ▼
wss://signal.dropcode.example.com
```

---

# 27. Important Technical Constraints

1. The server must never receive file chunks.
2. Do not upload files to S3/Firebase Storage in the MVP.
3. Do not put file data inside WebSocket messages.
4. WebSocket is for signaling only.
5. WebRTC DataChannel is for file data.
6. Large files must be chunked.
7. The UI must remain responsive during large transfers.
8. Do not load an entire large file into memory unnecessarily.
9. Room codes must expire.
10. Production must use HTTPS/WSS.
11. Browser limitations must be handled gracefully.
12. Mobile browsers must be tested independently from desktop browsers.

---

# 28. Definition of Done

The MVP is considered complete when:

- [ ] Sender can open the website.
- [ ] Sender can select a file.
- [ ] Sender receives a 6-character room code.
- [ ] Receiver can enter the code.
- [ ] Both browsers establish a WebRTC connection.
- [ ] Server only handles signaling.
- [ ] File data does not pass through the server.
- [ ] Receiver receives the file correctly.
- [ ] Progress is displayed.
- [ ] Transfer speed is displayed.
- [ ] Transfer can be cancelled.
- [ ] Room expires after inactivity.
- [ ] Desktop UI works.
- [ ] Mobile UI works.
- [ ] Chrome/Edge/Firefox/Safari are tested.
- [ ] Production uses HTTPS/WSS.

---

# 29. Project Identity

## Name

**DropCode**

## Tagline

> Send files directly. No upload. No cloud storage.

Alternative:

> Your files. Your devices. Directly.

## Core Product Message

```text
DropCode lets you send files directly
from one device to another using a simple
transfer code.

No account.
No cloud storage.
No file upload to our server.
```

---

# 30. Portfolio Description

### Short

**DropCode** is a responsive P2P file transfer web application that uses WebRTC for direct browser-to-browser file transfers and WebSocket for signaling. The server coordinates connections without storing file data.

### Technical

**Built with React, TypeScript, Node.js, WebSocket, and WebRTC DataChannel. Implemented temporary room-based pairing, chunked file transfer, real-time progress tracking, transfer statistics, connection handling, and responsive desktop/mobile UI.**
