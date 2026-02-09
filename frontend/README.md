# Local Ledger Frontend

A frontend application for managing investment profit and loss.

## Technology Stack

- **React 18** - Frontend framework
- **Ant Design 5** - UI component library
- **Vite** - Build tool
- **Axios** - HTTP client
- **Day.js** - Date manipulation library

## Getting Started

### Prerequisites

Before running the project, ensure you have:

- **Node.js >= 16.0.0**
  ```bash
  # Check Node.js version
  node -v
  ```

- **npm or yarn**
  ```bash
  # Check npm version
  npm -v
  ```

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### Running in Development Mode

```bash
# Start development server
npm run dev
```

The application will start at `http://localhost:3000`

### Building for Production

```bash
# Build the project
npm run build
```

Build artifacts will be generated in the `dist` directory.

### Preview Production Build

```bash
# Preview the production build locally
npm run preview
```

## Debugging Guide

### Development Tools

#### 1. Browser DevTools

**Chrome/Edge DevTools:**
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
- **Console Tab**: View logs, errors, and warnings
- **Network Tab**: Monitor API requests and responses
- **React DevTools**: Install the React Developer Tools extension for component inspection

**Useful Console Commands:**
```javascript
// Check if backend is accessible
fetch('/api/health').then(r => r.json()).then(console.log)

// View current React version
console.log(React.version)
```

#### 2. Vite Hot Module Replacement (HMR)

Vite provides instant feedback during development:
- Changes to `.jsx` files trigger automatic component updates
- CSS changes apply immediately without page reload
- Check terminal for compilation errors

#### 3. Network Debugging

**API Proxy Configuration** (in `vite.config.js`):
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true
  }
}
```

**Testing API Endpoints:**
```bash
# Test backend health check
curl http://localhost:3000/api/health

# Or use browser
open http://localhost:3000/api/hello
```

#### 4. Common Debugging Scenarios

**Backend Connection Issues:**
1. Verify backend is running: `curl http://localhost:8080/api/health`
2. Check proxy configuration in `vite.config.js`
3. Review browser Network tab for failed requests

**Component Not Updating:**
1. Check browser console for errors
2. Verify component state management
3. Use React DevTools to inspect component props and state

**Build Errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### IDE Configuration

**VS Code Recommended Extensions:**
- ESLint
- Prettier
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag

**VS Code Debug Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

## Project Structure

```
frontend/
├── src/
│   ├── main.jsx              # Application entry point
│   ├── App.jsx               # Main application component
│   ├── App.css               # Application styles
│   └── index.css             # Global styles
├── index.html                # HTML template
├── vite.config.js            # Vite configuration
└── package.json              # Project configuration
```

## Features

### Current Features

- Investment statistics dashboard
- Investment records list display
- Profit and loss data visualization
- Backend service connection status detection
- Responsive layout

### Planned Features

- Add/Edit/Delete investment records
- Chart analysis (profit trends, asset distribution, etc.)
- Data filtering and search
- Data import/export
- System settings

## API Endpoints

The frontend accesses backend APIs through proxy (configured in `vite.config.js`):

- `/api/health` - Health check endpoint
- `/api/hello` - Test endpoint

More endpoints will be added during development.

## Development Guidelines

1. Ensure backend service is running at `http://localhost:8080`
2. Frontend dev server automatically proxies `/api` requests to backend
3. Use Ant Design components for UI development
4. Follow React Hooks best practices
5. Keep components small and focused
6. Use meaningful variable and function names

## Troubleshooting

### Port Already in Use

If port 3000 is occupied, modify `vite.config.js`:

```javascript
server: {
  port: 3001,  // Change to another port
  // ...
}
```

### Dependency Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Use alternative registry (if needed)
npm install --registry=https://registry.npmjs.org/
```

### Hot Reload Not Working

1. Check if file is saved properly
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser cache and reload

## Integration with Backend

### Full Stack Development Workflow

**Terminal 1 - Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Verify Integration:**
1. Backend: `http://localhost:8080/api/health`
2. Frontend: `http://localhost:3000`
3. Frontend API call: `http://localhost:3000/api/health` (proxied to backend)
