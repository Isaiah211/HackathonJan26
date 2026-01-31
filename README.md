# City Impact Simulator

A web application for simulating the potential effects of physical infrastructure and digital service interventions on Capital Region communities.

## Features

- Interactive map interface using Leaflet
- Physical infrastructure simulations (bike lanes, housing, green spaces, transit, grocery stores)
- Digital service simulations (civic reporting apps, transit trackers, food pantry locators)
- Real-time impact visualization
- Coverage area mapping for digital interventions
- Responsive design for desktop and mobile

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will start on `http://localhost:5173` (or another port if 5173 is in use).

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
city-impact-simulator/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx              # Application entry point
    ├── App.jsx               # Main application component
    ├── styles.css            # Global styles
    ├── components/
    │   ├── Header.jsx        # Header with title and description
    │   ├── Sidebar.jsx       # Intervention selection panel
    │   ├── InterventionSelector.jsx
    │   ├── MapView.jsx       # Leaflet map integration
    │   └── ImpactPanel.jsx   # Impact visualization
    └── data/
        └── interventions.js  # Intervention definitions
```

## Usage

1. Select an intervention type from the sidebar (physical or digital)
2. Click on the map to place the intervention
3. View estimated impacts in the right panel
4. Use the reset button to start a new simulation

## Technology Stack

- React 18
- Vite
- Leaflet / React-Leaflet
- OpenStreetMap tiles

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT
