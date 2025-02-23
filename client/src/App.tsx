import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Outlet,
  Navigate
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DatabaseQueryPage from './pages/DatabaseQueryPage';
import CodeDocPage from './pages/CodeDocPage';
import ChatPage from './pages/ChatPage';
import { AuthButton } from './components/AuthButton';

// Define a configuration for your routes
const routesConfig = [
  {
    path: 'database',
    label: 'Database Query',
    element: <DatabaseQueryPage />,
    enabled: false,
  },
  {
    path: 'codedoc',
    label: 'Generate Code Documentation',
    element: <CodeDocPage />,
    enabled: true,
  },
  {
    path: 'chat',
    label: 'Chat with AI',
    element: <ChatPage />,
    enabled: true,
  },
];

const Header: React.FC = () => {
  return (
    <header className="w-full bg-gray-800 p-4 flex items-center justify-center">
      <div className="flex space-x-4  justify-center align">
        {routesConfig
          .filter((route) => route.enabled)
          .map((route) => (
            <Link
              key={route.path}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              to={`/${route.path}`}
            >
              {route.label}
            </Link>
          ))}
      </div>
      {/* <div className="flex items-center">
        <AuthButton />
      </div> */}
    </header>
  );
};

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-gray-800 text-gray-950 flex flex-col">
      <Header />
      <div className="flex-1 w-full">
        <Outlet />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/chat" replace />} />
            {routesConfig
              .filter((route) => route.enabled)
              .map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={route.element}
                />
              ))}
          </Route>
        </Routes>
      </Router>
      <Toaster position="top-center" />
    </>
  );
};

export default App;