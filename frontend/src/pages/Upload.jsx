import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

function Upload({ onOptimized }) {
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [clusters, setClusters] = useState(20)
    const [clusterSize, setClusterSize] = useState(25)
    const [mode, setMode] = useState('trucks') // 'trucks' or 'size'
    const navigate = useNavigate()

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0])
            setError(null)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
        },
        maxFiles: 1,
    })

    const buildQuery = () => {
        if (mode === 'size') return `cluster_size=${clusterSize}`
        return `clusters=${clusters}`
    }

    const handleOptimize = async () => {
        if (!file) return
        setLoading(true)
        setError(null)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await axios.post(`/api/optimize?${buildQuery()}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            onOptimized(res.data)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Optimization failed. Please check your file.')
        } finally {
            setLoading(false)
        }
    }

    const handleDemo = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await axios.get(`/api/optimize/demo?${buildQuery()}`)
            onOptimized(res.data)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Demo failed.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner" />
                    <p className="loading-text">Optimizing routes with AI...</p>
                    <p className="loading-subtext">Running K-Means clustering + TSP solver</p>
                </div>
            )}

            <div className="page">
                <div className="page-header" style={{ textAlign: 'center' }}>
                    <h1>
                        <span className="gradient-text">AI-Powered</span> Route Optimization
                    </h1>
                    <p>Upload your shipment data and let our algorithm find the optimal truck routes</p>
                </div>

                <div className="upload-container">
                    <div
                        {...getRootProps()}
                        className={`dropzone ${isDragActive ? 'active' : ''}`}
                    >
                        <input {...getInputProps()} />
                        <div className="upload-icon">📤</div>
                        <h3>{isDragActive ? 'Drop your file here!' : 'Drag & drop your Excel file'}</h3>
                        <p>or click to browse from your computer</p>
                        <span className="file-types">.xlsx .xls</span>
                    </div>

                    {file && (
                        <div className="selected-file">
                            <span className="file-icon">📊</span>
                            <span>{file.name}</span>
                            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                {(file.size / 1024).toFixed(1)} KB
                            </span>
                        </div>
                    )}

                    {/* Cluster mode toggle */}
                    <div style={{
                        marginTop: 24,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 0,
                    }}>
                        <button
                            onClick={() => setMode('trucks')}
                            style={{
                                padding: '10px 22px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px 0 0 8px',
                                cursor: 'pointer',
                                background: mode === 'trucks'
                                    ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                                    : 'var(--bg-card)',
                                color: mode === 'trucks' ? '#fff' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            🚛 By Number of Trucks
                        </button>
                        <button
                            onClick={() => setMode('size')}
                            style={{
                                padding: '10px 22px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                border: '1px solid var(--border-color)',
                                borderLeft: 'none',
                                borderRadius: '0 8px 8px 0',
                                cursor: 'pointer',
                                background: mode === 'size'
                                    ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
                                    : 'var(--bg-card)',
                                color: mode === 'size' ? '#fff' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            📦 By Max Houses/Truck
                        </button>
                    </div>

                    {/* Cluster settings */}
                    <div style={{
                        marginTop: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        justifyContent: 'center',
                    }}>
                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {mode === 'trucks' ? 'Number of trucks:' : 'Max houses per truck:'}
                        </label>
                        <input
                            type="number"
                            min={mode === 'trucks' ? 2 : 5}
                            max={mode === 'trucks' ? 50 : 200}
                            value={mode === 'trucks' ? clusters : clusterSize}
                            onChange={(e) => {
                                const val = Number(e.target.value)
                                if (mode === 'trucks') setClusters(val)
                                else setClusterSize(val)
                            }}
                            style={{
                                width: 70,
                                padding: '8px 12px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.95rem',
                                textAlign: 'center',
                            }}
                        />
                    </div>

                    {mode === 'size' && (
                        <p style={{
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '0.78rem',
                            marginTop: 6,
                            fontStyle: 'italic',
                        }}>
                            Trucks will be auto-calculated to ensure each has ≤ {clusterSize} houses
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleOptimize}
                            disabled={!file || loading}
                        >
                            🚀 Optimize Routes
                        </button>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <button
                            className="btn btn-secondary btn-demo"
                            onClick={handleDemo}
                            disabled={loading}
                        >
                            ⚡ Try Demo Data
                        </button>
                    </div>

                    {error && <div className="error-msg">❌ {error}</div>}
                </div>
            </div>
        </>
    )
}

export default Upload

