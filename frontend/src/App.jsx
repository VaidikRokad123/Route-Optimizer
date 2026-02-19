import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import { useState } from 'react'

function App() {
    const [routeData, setRouteData] = useState(null)

    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Upload onOptimized={setRouteData} />} />
                <Route path="/dashboard" element={<Dashboard data={routeData} onOptimized={setRouteData} />} />
            </Routes>
        </Router>
    )
}

export default App
