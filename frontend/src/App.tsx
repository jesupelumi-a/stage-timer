import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import { DisplayRoute } from './routes/display-route';
import { ControllerRoute } from './routes/controller-route';
import { RoomSelectionRoute } from './routes/room-selection-route';

function App() {
  return (
    <HeroUIProvider>
      <Router>
        <div className="min-h-screen bg-black text-white dark">
          <Routes>
            {/* Room selection page */}
            <Route path="/" element={<RoomSelectionRoute />} />

            {/* Display route - for TV/projector */}
            <Route path="/display/:roomSlug" element={<DisplayRoute />} />

            {/* Controller route - for operator */}
            <Route path="/control/:roomSlug" element={<ControllerRoute />} />

            {/* Legacy routes for backward compatibility */}
            <Route path="/control" element={<RoomSelectionRoute />} />

            {/* Catch all - redirect to room selection */}
            <Route path="*" element={<RoomSelectionRoute />} />
          </Routes>
        </div>
      </Router>
    </HeroUIProvider>
  );
}

export default App;
