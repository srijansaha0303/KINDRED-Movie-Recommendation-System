import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import Browse from "./pages/Browse";
import Recommendations from "./pages/Recommendations";
import WatchList from "./pages/WatchList";
import WatchHistory from "./pages/WatchHistory";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-ink">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/recommendations"
            element={<ProtectedRoute><Recommendations /></ProtectedRoute>}
          />
          <Route
            path="/watchlist"
            element={<ProtectedRoute><WatchList /></ProtectedRoute>}
          />
          <Route
            path="/history"
            element={<ProtectedRoute><WatchHistory /></ProtectedRoute>}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute><Profile /></ProtectedRoute>}
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}
