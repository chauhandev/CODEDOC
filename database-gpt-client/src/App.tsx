import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import DatabaseQueryPage from './pages/DatabaseQueryPage';
import GeneralQueryPage from './pages/GeneralQueryPage';
import CodeDocPage from './pages/CodeDocPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center p-5">
        <nav className="mb-5">
          <Link
            className="bg-blue-500 text-white p-2 rounded mx-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            to="/database"
          >
            Database Query
          </Link>
          <Link
            className="bg-blue-500 text-white p-2 rounded mx-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            to="/general"
          >
            General Query
          </Link>
          <Link
            className="bg-blue-500 text-white p-2 rounded mx-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            to="/codedoc"
          >
            Generate Code Documentation
          </Link>
        </nav>
        <div className="flex-1 w-full flex justify-center items-center">
          <Routes>
            <Route path="/database" element={<DatabaseQueryPage />} />
            <Route path="/general" element={<GeneralQueryPage />} />
            <Route path="/codedoc" element={<CodeDocPage />} />
          </Routes>
        </div>
      </div>
      <Outlet />
    </Router>
  );
};

export default App;
