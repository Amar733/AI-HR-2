import { useState, useEffect, useRef } from "react";
import {
  Navbar as BsNavbar,
  Nav,
  Container,
  Dropdown,
  Button,
} from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/router";
import { APP_NAME } from "../../utils/constants";

export default function Navbar({
  user = {},
  onLogout = () => {},
  onMenuClick = () => {},
}) {
  const router = useRouter();
  const navbarRef = useRef(null);
  const toggleRef = useRef(null);
  const menuRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // detect mobile (only runs in browser)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 576);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // close when clicking outside or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e) {
      if (toggleRef.current && toggleRef.current.contains(e.target)) return;
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setMenuOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Are you sure you want to logout?")
    ) {
      setMenuOpen(false);
      onLogout();
    }
  };

  const initial = (user?.name && user.name.charAt(0).toUpperCase()) || "U";

  // compute top for the fixed mobile menu (height of navbar)
  const navbarHeight =
    typeof window !== "undefined" && navbarRef.current
      ? Math.ceil(navbarRef.current.getBoundingClientRect().height)
      : 56;

  // helper for mobile nav actions (close menu then navigate)
  const go = (path) => {
    setMenuOpen(false);
    router.push(path);
  };

  return (
    <BsNavbar
      bg="white"
      variant="light"
      expand="lg"
      className="custom-navbar shadow-sm fixed-top"
      fixed="top"
      ref={navbarRef}
    >
      <Container
        fluid
        className="d-flex justify-content-between align-items-center"
      >
        {/* Left side - Sidebar toggle + Brand */}
        <div className="d-flex align-items-center">
          <Button
            variant="link"
            className="d-lg-none text-dark p-0 me-3 sidebar-toggle"
            onClick={onMenuClick}
          >
            <i className="bi bi-list fs-4" />
          </Button>

          <BsNavbar.Brand>
            <Link
              href="/dashboard"
              className="text-decoration-none d-flex align-items-center gap-2"
            >
              <div className="d-none d-md-flex flex-column">
                <span className="brand-title">{APP_NAME}</span>
                <small className="brand-subtitle">Interview Intelligence</small>
              </div>
            </Link>
          </BsNavbar.Brand>
        </div>

        {/* Right side - User menu */}
        <Nav className="align-items-center">
          {isMobile ? (
            <>
              <button
                ref={toggleRef}
                className="user-toggle-btn d-flex align-items-center text-decoration-none"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-label="Account menu"
                type="button"
              >
                <div className="user-avatar bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-2">
                  {initial}
                </div>
                <i className="bi bi-chevron-down" />
              </button>

              {menuOpen && (
                <div
                  ref={menuRef}
                  className="mobile-account-menu"
                  style={{ top: `${navbarHeight}px` }}
                >
                  <div className="p-3 border-bottom">
                    <div className="fw-semibold">{user?.name || "User"}</div>
                    <small className="text-muted">
                      {user?.email || "user@example.com"}
                    </small>
                  </div>

                  <div className="list-group list-group-flush">
                    <button
                      className="list-group-item list-group-item-action"
                      onClick={() => go("/dashboard")}
                    >
                      <i className="bi bi-speedometer2 me-2"></i>Dashboard
                    </button>
                    <button
                      className="list-group-item list-group-item-action"
                      onClick={() => go("/settings")}
                    >
                      <i className="bi bi-gear me-2"></i>Settings
                    </button>
                    {/* <button
                      className="list-group-item list-group-item-action"
                      onClick={() => go("/payments")}
                    >
                      <i className="bi bi-credit-card me-2"></i>Billing
                    </button>

                    <div className="px-2 my-2">
                      <button
                        className="btn btn-sm w-100 mb-2"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push("/help");
                        }}
                      >
                        <i className="bi bi-question-circle me-2"></i>Help &
                        Support
                      </button>
                      <button
                        className="btn btn-sm w-100 mb-2"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push("/feedback");
                        }}
                      >
                        <i className="bi bi-chat-dots me-2"></i>Feedback
                      </button>
                    </div> */}

                    <div className="px-2 pb-3">
                      <button
                        className="btn btn-outline-danger w-100"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Desktop: keep normal bootstrap dropdown (uses Popper; fine on larger viewports)
            <Dropdown align="end" className="user-menu-dropdown">
              <Dropdown.Toggle
                variant="link"
                className="user-dropdown d-flex align-items-center text-decoration-none"
                id="user-dropdown"
              >
                <div className="user-avatar bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-2">
                  {initial}
                </div>
                <div className="d-none d-md-block text-start">
                  <div className="user-name fw-semibold">
                    {user?.name || "User"}
                  </div>
                  <small className="text-muted">
                    {user?.company || "Company"}
                  </small>
                </div>
                <i className="bi bi-chevron-down ms-2" />
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <div className="p-3 border-bottom">
                  <div className="fw-semibold">{user?.name || "User"}</div>
                  <small className="text-muted">
                    {user?.email || "user@example.com"}
                  </small>
                </div>

                <Dropdown.Item as={Link} href="/dashboard">
                  <i className="bi bi-speedometer2 me-2"></i>Dashboard
                </Dropdown.Item>
                <Dropdown.Item as={Link} href="/settings">
                  <i className="bi bi-gear me-2"></i>Settings
                </Dropdown.Item>
                {/* <Dropdown.Item as={Link} href="/payments">
                  <i className="bi bi-credit-card me-2"></i>Billing
                </Dropdown.Item>

                <Dropdown.Divider />

                <Dropdown.Item onClick={() => router.push("/help")}>
                  <i className="bi bi-question-circle me-2"></i>Help & Support
                </Dropdown.Item>
                <Dropdown.Item onClick={() => router.push("/feedback")}>
                  <i className="bi bi-chat-dots me-2"></i>Feedback
                </Dropdown.Item> */}

                <Dropdown.Divider />

                <Dropdown.Item onClick={handleLogout} className="text-danger">
                  <i className="bi bi-box-arrow-right me-2"></i>Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </Nav>
      </Container>
    </BsNavbar>
  );
}
