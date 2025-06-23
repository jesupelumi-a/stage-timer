import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/query-client';
import { DisplayRoute } from './routes/display-route';
import { ControllerRoute } from './routes/controller-route';
import { RoomSelectionRoute } from './routes/room-selection-route';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-black text-white">
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

      {/* React Query DevTools (only in development) */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
