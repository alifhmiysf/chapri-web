
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Groups from "./pages/groups/Groups";
import GroupDetail from "./pages/groups/GroupDetail";
import PrivateChats from "./pages/chat/PrivateChats";
import ChatRoom from "./pages/chat/ChatRoom";
import PublicProject from "./pages/public/PublicProject";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* PUBLIC PROJECT - NO LOGIN REQUIRED */}
          <Route
            path="/public/projects/:shareId"
            element={<PublicProject />}
          />

          {/* PRIVATE APPLICATION */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:id" element={<GroupDetail />} />
              <Route path="/chats" element={<PrivateChats />} />
              <Route path="/chats/:chatId" element={<ChatRoom />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
