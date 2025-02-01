import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Outlet,
} from "react-router-dom";
import DatabaseQueryPage from "./pages/DatabaseQueryPage";
import CodeDocPage from "./pages/CodeDocPage";
import ChatPage from "./pages/ChatPage";

// Define a configuration for your routes
const routesConfig = [
  {
    path: "database",
    label: "Database Query",
    element: <DatabaseQueryPage />,
    enabled: false, // Set to false to disable this route
  },
  {
    path: "codedoc",
    label: "Generate Code Documentation",
    element: <CodeDocPage />,
    enabled: true,
  },
  {
    path: "ChatWihAI",
    label: "Chat with AI",
    element: <ChatPage />,
    enabled: true,
  },
];

const Header: React.FC = () => {
  return (
    <header className="w-full bg-gray-800 p-4 flex justify-center space-x-4">
      {routesConfig
        .filter((route) => route.enabled)
        .map((route) => (
          <Link
            key={route.path}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
            to={`/${route.path}`}
          >
            {route.label}
          </Link>
        ))}
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
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
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
  );
};

export default App;
