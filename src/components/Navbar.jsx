// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "../components/ThemeContext";

// Using Bootstrap Icons (bi)
export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { theme, toggleTheme } = useContext(ThemeContext);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear token
    navigate("/"); // Redirect to login
  };

  return (
    <nav
      className={`navbar navbar-expand-lg ${
        theme === "dark" ? "navbar-dark bg-dark" : "navbar-light bg-light"
      } px-3`}
    >
      <Link className="navbar-brand" to="/">
        MyApp
      </Link>
      <div className="collapse navbar-collapse">
        <ul className="navbar-nav ms-auto align-items-center">
          {!token ? (
            <>
              {/* <li className="nav-item">
                <Link
                  className={`btn ${
                    theme === "dark"
                      ? "btn-outline-light"
                      : "btn-outline-dark"
                  } mx-2`}
                  to="/login"
                >
                  Login
                </Link>
              </li> */}
              {/* <li className="nav-item">
                <Link
                  className={`btn ${
                    theme === "dark"
                      ? "btn-outline-light"
                      : "btn-outline-dark"
                  } mx-2`}
                  to="/register"
                >
                  Register
                </Link>
              </li> */}
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link
                  className={`btn ${
                    theme === "dark"
                      ? "btn-outline-light"
                      : "btn-outline-dark"
                  } mx-2`}
                  to="/dashboard"
                >
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <button className="btn btn-danger mx-2" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          )}
          {/* Dark mode icon toggle */}
          <li className="nav-item">
            <button
              onClick={toggleTheme}
              className="btn btn-link mx-2"
              style={{ fontSize: "1.3rem" }}
            >
              {theme === "dark" ? (
                <i className="bi bi-sun-fill text-warning"></i> // sun icon
              ) : (
                <i className="bi bi-moon-fill text-dark"></i> // moon icon
              )}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
