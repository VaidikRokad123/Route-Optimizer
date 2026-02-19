import { NavLink } from 'react-router-dom'

function Navbar() {
    return (
        <nav className="navbar">
            <NavLink to="/" className="navbar-brand">
                <div className="logo-icon">🛣️</div>
                <span>RouteAI</span>
            </NavLink>
            <div className="navbar-links">
                <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
                    Upload
                </NavLink>
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                    Dashboard
                </NavLink>
            </div>
        </nav>
    )
}

export default Navbar
