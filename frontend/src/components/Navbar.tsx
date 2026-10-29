import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse" },
  { to: "/recommendations", label: "For You" },
  { to: "/watchlist", label: "Watchlist" },
  { to: "/history", label: "History" },
  { to: "/profile", label: "Profile" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, username, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm tracking-wide transition-colors ${
      isActive ? "text-gold" : "text-parchment/70 hover:text-parchment"
    }`;

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-ink/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <NavLink to="/" className="font-display text-xl text-parchment">
          Kindred
        </NavLink>

        <nav className="hidden gap-8 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} end={l.to === "/"}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted">{username}</span>
              <button onClick={handleLogout} className="text-sm text-parchment/70 hover:text-parchment">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Log in</NavLink>
              <NavLink
                to="/signup"
                className="border border-gold px-3 py-1.5 text-sm text-gold hover:bg-gold hover:text-ink"
              >
                Sign up
              </NavLink>
            </>
          )}
        </div>

        <button
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`h-px w-5 bg-parchment transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-px w-5 bg-parchment transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-px w-5 bg-parchment transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-4 border-t border-rule px-5 py-4 md:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} end={l.to === "/"} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <div className="mt-2 flex flex-col gap-3 border-t border-rule pt-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted">{username}</span>
                <button onClick={() => { handleLogout(); setOpen(false); }} className="text-left text-sm text-parchment/70">
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setOpen(false)} className={linkClass}>Log in</NavLink>
                <NavLink to="/signup" onClick={() => setOpen(false)} className={linkClass}>Sign up</NavLink>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
