import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DisplayRoute } from './routes/DisplayRouteSimple';
import { ControllerRoute } from './routes/ControllerRouteFinal';

function App() {
  return (
    <Router>
      <div className="app h-screen w-screen overflow-hidden">
        <Routes>
          {/* Display Route - Root path for TV/projector display */}
          <Route path="/" element={<DisplayRoute />} />

          {/* Controller Route - Management interface */}
          <Route path="/control" element={<ControllerRoute />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
