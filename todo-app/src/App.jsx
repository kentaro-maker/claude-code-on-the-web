import { useState, useEffect } from 'react'
import './App.css'

const STORAGE_KEY = 'product-app-products'
const SERIES_STORAGE_KEY = 'product-app-series'
const MOLDS_STORAGE_KEY = 'product-app-molds'

function App() {
  // Load products from localStorage on initial render
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem(STORAGE_KEY)
    return savedProducts ? JSON.parse(savedProducts) : []
  })

  // Load series from localStorage
  const [seriesData, setSeriesData] = useState(() => {
    const savedSeries = localStorage.getItem(SERIES_STORAGE_KEY)
    return savedSeries ? JSON.parse(savedSeries) : []
  })

  // Load molds from localStorage
  const [moldsData, setMoldsData] = useState(() => {
    const savedMolds = localStorage.getItem(MOLDS_STORAGE_KEY)
    return savedMolds ? JSON.parse(savedMolds) : []
  })

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    series: '',
    description: '',
    quantity: '',
    size: '',
    unit: 'sq ft',
    piecesPerBox: '',
    sqFtPerBox: '',
    boxesPerPallet: ''
  })

  const [editingId, setEditingId] = useState(null)
  const [newSeriesInput, setNewSeriesInput] = useState('')
  const [showNewSeriesInput, setShowNewSeriesInput] = useState(false)
  const [activeView, setActiveView] = useState('overview') // 'overview', 'add', 'series', 'addSeries', 'molds', 'addMold'

  // Series management state
  const [editingSeriesId, setEditingSeriesId] = useState(null)
  const [seriesFormData, setSeriesFormData] = useState({
    name: '',
    description: ''
  })

  // Mold management state
  const [editingMoldId, setEditingMoldId] = useState(null)
  const [moldFormData, setMoldFormData] = useState({
    size: '',
    description: ''
  })

  // Save products to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  }, [products])

  // Save series to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SERIES_STORAGE_KEY, JSON.stringify(seriesData))
  }, [seriesData])

  // Save molds to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(MOLDS_STORAGE_KEY, JSON.stringify(moldsData))
  }, [moldsData])

  // Get all series (from seriesData and products)
  const getAllSeries = () => {
    const productSeries = new Set(products.map(p => p.series).filter(s => s))
    const manualSeries = seriesData.map(s => s.name)
    const allSeries = new Set([...productSeries, ...manualSeries])
    return Array.from(allSeries).sort()
  }

  // Get unique series from existing products (for backwards compatibility)
  const getUniqueSeries = getAllSeries

  // Calculate dashboard metrics
  const getMetrics = () => {
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0)
    const uniqueSeries = getUniqueSeries().length
    const avgPrice = products.length > 0
      ? products.reduce((sum, p) => sum + p.price, 0) / products.length
      : 0
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity < 10).length

    // Tile-specific metrics
    const totalBoxes = products.reduce((sum, p) => {
      if (p.piecesPerBox > 0 && p.quantity > 0) {
        return sum + Math.ceil(p.quantity / p.piecesPerBox)
      }
      return sum
    }, 0)

    const totalPallets = products.reduce((sum, p) => {
      if (p.piecesPerBox > 0 && p.boxesPerPallet > 0 && p.quantity > 0) {
        const boxes = Math.ceil(p.quantity / p.piecesPerBox)
        return sum + Math.ceil(boxes / p.boxesPerPallet)
      }
      return sum
    }, 0)

    const totalSqFt = products.reduce((sum, p) => {
      if (p.sqFtPerBox > 0 && p.piecesPerBox > 0 && p.quantity > 0) {
        const boxes = Math.ceil(p.quantity / p.piecesPerBox)
        return sum + (boxes * p.sqFtPerBox)
      }
      return sum
    }, 0)

    const seriesBreakdown = products.reduce((acc, p) => {
      if (p.series) {
        acc[p.series] = (acc[p.series] || 0) + 1
      }
      return acc
    }, {})

    return {
      totalValue,
      totalQuantity,
      uniqueSeries,
      avgPrice,
      lowStock,
      totalBoxes,
      totalPallets,
      totalSqFt,
      seriesBreakdown
    }
  }

  // Series Management Functions
  const handleSeriesInputChange = (e) => {
    const { name, value } = e.target
    setSeriesFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addNewSeries = () => {
    if (seriesFormData.name.trim() !== '') {
      const newSeries = {
        id: Date.now(),
        name: seriesFormData.name.trim(),
        description: seriesFormData.description.trim()
      }
      setSeriesData([...seriesData, newSeries])
      setSeriesFormData({ name: '', description: '' })
      setActiveView('series')
    }
  }

  const editSeries = (series) => {
    const seriesObj = seriesData.find(s => s.name === series)
    if (seriesObj) {
      setSeriesFormData({
        name: seriesObj.name,
        description: seriesObj.description || ''
      })
      setEditingSeriesId(seriesObj.id)
    } else {
      // This is a product-only series, create it
      setSeriesFormData({
        name: series,
        description: ''
      })
      setEditingSeriesId('product-' + series)
    }
  }

  const updateSeries = () => {
    if (seriesFormData.name.trim() !== '' && editingSeriesId) {
      if (typeof editingSeriesId === 'number') {
        // Update existing series in seriesData
        const oldSeries = seriesData.find(s => s.id === editingSeriesId)
        setSeriesData(seriesData.map(s =>
          s.id === editingSeriesId
            ? { ...s, name: seriesFormData.name.trim(), description: seriesFormData.description.trim() }
            : s
        ))

        // Update products using old series name
        if (oldSeries && oldSeries.name !== seriesFormData.name.trim()) {
          setProducts(products.map(product =>
            product.series === oldSeries.name
              ? { ...product, series: seriesFormData.name.trim() }
              : product
          ))
        }
      } else {
        // This was a product-only series, now add it to seriesData
        const oldName = editingSeriesId.replace('product-', '')
        const newSeries = {
          id: Date.now(),
          name: seriesFormData.name.trim(),
          description: seriesFormData.description.trim()
        }
        setSeriesData([...seriesData, newSeries])

        // Update products using old series name if name changed
        if (oldName !== seriesFormData.name.trim()) {
          setProducts(products.map(product =>
            product.series === oldName
              ? { ...product, series: seriesFormData.name.trim() }
              : product
          ))
        }
      }
      setEditingSeriesId(null)
      setSeriesFormData({ name: '', description: '' })
    }
  }

  const cancelSeriesEdit = () => {
    setEditingSeriesId(null)
    setSeriesFormData({ name: '', description: '' })
    if (activeView === 'addSeries') {
      setActiveView('series')
    }
  }

  const deleteSeries = (seriesName) => {
    const productsUsingSeries = products.filter(p => p.series === seriesName).length
    const seriesObj = seriesData.find(s => s.name === seriesName)

    if (productsUsingSeries > 0) {
      const confirmed = window.confirm(
        `This series is used by ${productsUsingSeries} product(s). Deleting it will remove the series from all these products. Continue?`
      )
      if (!confirmed) return
    }

    // Remove from seriesData if it exists there
    if (seriesObj) {
      setSeriesData(seriesData.filter(s => s.id !== seriesObj.id))
    }

    // Remove series from all products
    setProducts(products.map(product =>
      product.series === seriesName
        ? { ...product, series: '' }
        : product
    ))
  }

  const handleSeriesKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (editingSeriesId) {
        updateSeries()
      } else {
        addNewSeries()
      }
    }
  }

  // Mold Management Functions
  const handleMoldInputChange = (e) => {
    const { name, value } = e.target
    setMoldFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addNewMold = () => {
    if (moldFormData.size.trim() !== '') {
      const newMold = {
        id: Date.now(),
        size: moldFormData.size.trim(),
        description: moldFormData.description.trim()
      }
      setMoldsData([...moldsData, newMold])
      setMoldFormData({ size: '', description: '' })
      setActiveView('molds')
    }
  }

  const editMold = (moldId) => {
    const moldObj = moldsData.find(m => m.id === moldId)
    if (moldObj) {
      setMoldFormData({
        size: moldObj.size,
        description: moldObj.description || ''
      })
      setEditingMoldId(moldObj.id)
    }
  }

  const updateMold = () => {
    if (moldFormData.size.trim() !== '' && editingMoldId) {
      const oldMold = moldsData.find(m => m.id === editingMoldId)
      setMoldsData(moldsData.map(m =>
        m.id === editingMoldId
          ? { ...m, size: moldFormData.size.trim(), description: moldFormData.description.trim() }
          : m
      ))

      // Update products using old mold size
      if (oldMold && oldMold.size !== moldFormData.size.trim()) {
        setProducts(products.map(product =>
          product.size === oldMold.size
            ? { ...product, size: moldFormData.size.trim() }
            : product
        ))
      }

      setEditingMoldId(null)
      setMoldFormData({ size: '', description: '' })
      setActiveView('molds')
    }
  }

  const cancelMoldEdit = () => {
    setEditingMoldId(null)
    setMoldFormData({ size: '', description: '' })
    if (activeView === 'addMold') {
      setActiveView('molds')
    }
  }

  const deleteMold = (moldId) => {
    const moldObj = moldsData.find(m => m.id === moldId)
    if (!moldObj) return

    const productsUsingMold = products.filter(p => p.size === moldObj.size).length

    if (productsUsingMold > 0) {
      const confirmed = window.confirm(
        `This mold size is used by ${productsUsingMold} tile(s). Deleting it will remove the size from all these tiles. Continue?`
      )
      if (!confirmed) return
    }

    setMoldsData(moldsData.filter(m => m.id !== moldId))

    // Remove size from all products using this mold
    setProducts(products.map(product =>
      product.size === moldObj.size
        ? { ...product, size: '' }
        : product
    ))
  }

  const handleMoldKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (editingMoldId) {
        updateMold()
      } else {
        addNewMold()
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSeriesChange = (e) => {
    const value = e.target.value
    if (value === '__new__') {
      setShowNewSeriesInput(true)
      setFormData(prev => ({ ...prev, series: '' }))
    } else {
      setShowNewSeriesInput(false)
      setFormData(prev => ({ ...prev, series: value }))
    }
  }

  const handleNewSeriesChange = (e) => {
    setNewSeriesInput(e.target.value)
    setFormData(prev => ({ ...prev, series: e.target.value }))
  }

  const saveProduct = () => {
    if (formData.name.trim() !== '' && formData.price.trim() !== '') {
      if (editingId) {
        // Update existing product
        setProducts(products.map(product =>
          product.id === editingId
            ? {
                ...product,
                name: formData.name,
                price: parseFloat(formData.price),
                series: formData.series,
                description: formData.description,
                quantity: formData.quantity ? parseInt(formData.quantity) : 0,
                size: formData.size,
                unit: formData.unit,
                piecesPerBox: formData.piecesPerBox ? parseInt(formData.piecesPerBox) : 0,
                sqFtPerBox: formData.sqFtPerBox ? parseFloat(formData.sqFtPerBox) : 0,
                boxesPerPallet: formData.boxesPerPallet ? parseInt(formData.boxesPerPallet) : 0
              }
            : product
        ))
        setEditingId(null)
      } else {
        // Add new product
        const newProduct = {
          id: Date.now(),
          name: formData.name,
          price: parseFloat(formData.price),
          series: formData.series,
          description: formData.description,
          quantity: formData.quantity ? parseInt(formData.quantity) : 0,
          size: formData.size,
          unit: formData.unit,
          piecesPerBox: formData.piecesPerBox ? parseInt(formData.piecesPerBox) : 0,
          sqFtPerBox: formData.sqFtPerBox ? parseFloat(formData.sqFtPerBox) : 0,
          boxesPerPallet: formData.boxesPerPallet ? parseInt(formData.boxesPerPallet) : 0
        }
        setProducts([...products, newProduct])
      }

      // Reset form
      setFormData({
        name: '',
        price: '',
        series: '',
        description: '',
        quantity: '',
        size: '',
        unit: 'sq ft',
        piecesPerBox: '',
        sqFtPerBox: '',
        boxesPerPallet: ''
      })
      setShowNewSeriesInput(false)
      setNewSeriesInput('')
      setActiveView('overview')
    }
  }

  const editProduct = (product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      series: product.series || '',
      description: product.description || '',
      quantity: product.quantity.toString(),
      size: product.size || '',
      unit: product.unit || 'sq ft',
      piecesPerBox: product.piecesPerBox ? product.piecesPerBox.toString() : '',
      sqFtPerBox: product.sqFtPerBox ? product.sqFtPerBox.toString() : '',
      boxesPerPallet: product.boxesPerPallet ? product.boxesPerPallet.toString() : ''
    })
    setEditingId(product.id)
    setShowNewSeriesInput(false)
    setNewSeriesInput('')
    setActiveView('add')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({
      name: '',
      price: '',
      series: '',
      description: '',
      quantity: '',
      size: '',
      unit: 'sq ft',
      piecesPerBox: '',
      sqFtPerBox: '',
      boxesPerPallet: ''
    })
    setShowNewSeriesInput(false)
    setNewSeriesInput('')
    setActiveView('overview')
  }

  const deleteProduct = (id) => {
    setProducts(products.filter(product => product.id !== id))
    if (editingId === id) {
      cancelEdit()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.name !== 'description') {
      saveProduct()
    }
  }

  const metrics = getMetrics()
  const uniqueSeries = getUniqueSeries()

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">🏗️ Tile Hub</h2>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${activeView === 'series' ? 'active' : ''}`}
            onClick={() => setActiveView('series')}
          >
            <span className="nav-icon">🏷️</span>
            <span>Manage Series</span>
          </button>
          <button
            className={`nav-item ${activeView === 'molds' ? 'active' : ''}`}
            onClick={() => setActiveView('molds')}
          >
            <span className="nav-icon">🔨</span>
            <span>Manage Molds</span>
          </button>
          <button
            className={`nav-item ${activeView === 'add' ? 'active' : ''}`}
            onClick={() => setActiveView('add')}
          >
            <span className="nav-icon">🏗️</span>
            <span>Manage Tiles</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="quick-stats">
            <p className="quick-stat-label">Tile Types</p>
            <p className="quick-stat-value">{products.length}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              {activeView === 'overview' && 'Tile Inventory Dashboard'}
              {activeView === 'series' && 'Series Management'}
              {activeView === 'addSeries' && (editingSeriesId ? 'Edit Series' : 'Add New Series')}
              {activeView === 'molds' && 'Mold Management'}
              {activeView === 'addMold' && (editingMoldId ? 'Edit Mold' : 'Add New Mold')}
              {activeView === 'add' && (editingId ? 'Edit Tile' : 'Manage Tiles')}
            </h1>
            <p className="dashboard-subtitle">
              {activeView === 'overview' && 'Monitor and manage your tile inventory, packing, and palletizing'}
              {activeView === 'series' && 'Manage your tile series and categories'}
              {activeView === 'addSeries' && 'Fill in the series details below'}
              {activeView === 'molds' && 'Manage available mold sizes for tile production'}
              {activeView === 'addMold' && 'Fill in the mold size details below'}
              {activeView === 'add' && (editingId ? 'Edit tile details below' : 'Add or manage your tile inventory')}
            </p>
          </div>
        </header>

        {/* Overview View */}
        {activeView === 'overview' && (
          <>
            {/* Metrics Cards */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">💰</div>
                <div className="metric-content">
                  <p className="metric-label">Total Value</p>
                  <p className="metric-value">${metrics.totalValue.toFixed(2)}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">🏗️</div>
                <div className="metric-content">
                  <p className="metric-label">Tile Types</p>
                  <p className="metric-value">{products.length}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                  <p className="metric-label">Total Pieces</p>
                  <p className="metric-value">{metrics.totalQuantity}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">📦</div>
                <div className="metric-content">
                  <p className="metric-label">Total Boxes</p>
                  <p className="metric-value">{metrics.totalBoxes}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">🚚</div>
                <div className="metric-content">
                  <p className="metric-label">Total Pallets</p>
                  <p className="metric-value">{metrics.totalPallets}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">📐</div>
                <div className="metric-content">
                  <p className="metric-label">Total Coverage</p>
                  <p className="metric-value">{metrics.totalSqFt.toFixed(0)} sq ft</p>
                </div>
              </div>
            </div>

            {/* Series Breakdown */}
            {uniqueSeries.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">Series Breakdown</h2>
                  <button
                    className="btn-primary"
                    onClick={() => setActiveView('series')}
                  >
                    🏷️ Manage Series
                  </button>
                </div>
                <div className="series-breakdown">
                  {uniqueSeries.map(series => (
                    <div key={series} className="series-item">
                      <span className="series-name">{series}</span>
                      <span className="series-count">{metrics.seriesBreakdown[series]} products</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tiles Table */}
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">All Tiles</h2>
                <button
                  className="btn-primary"
                  onClick={() => setActiveView('add')}
                >
                  ➕ Add Tile
                </button>
              </div>

              {products.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏗️</div>
                  <p className="empty-title">No tiles yet</p>
                  <p className="empty-description">Get started by adding your first tile product</p>
                  <button
                    className="btn-primary"
                    onClick={() => setActiveView('add')}
                  >
                    Add Your First Tile
                  </button>
                </div>
              ) : (
                <div className="product-grid">
                  {products.map(product => (
                    <div key={product.id} className="product-card">
                      <div className="product-header">
                        <h3 className="product-name">{product.name}</h3>
                        <div className="product-actions">
                          <button onClick={() => editProduct(product)} className="edit-button" title="Edit product">
                            ✏️
                          </button>
                          <button onClick={() => deleteProduct(product.id)} className="delete-button" title="Delete product">
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="product-details">
                        {product.series && (
                          <div className="product-series">
                            <span className="series-badge">{product.series}</span>
                          </div>
                        )}

                        {product.size && (
                          <div className="product-size">
                            <span className="label">Size:</span>
                            <span className="value">{product.size}</span>
                          </div>
                        )}

                        <div className="product-price">
                          <span className="label">Price:</span>
                          <span className="value">${product.price.toFixed(2)} {product.unit ? `/ ${product.unit}` : ''}</span>
                        </div>

                        {product.quantity > 0 && (
                          <div className="product-quantity">
                            <span className="label">Quantity:</span>
                            <span className={`value ${product.quantity < 10 ? 'low-stock' : ''}`}>
                              {product.quantity} {product.unit || 'pieces'}
                              {product.quantity < 10 && <span className="low-stock-badge">Low</span>}
                            </span>
                          </div>
                        )}

                        {product.piecesPerBox > 0 && (
                          <div className="product-packing">
                            <span className="label">Packing:</span>
                            <span className="value">{product.piecesPerBox} pcs/box{product.sqFtPerBox > 0 ? `, ${product.sqFtPerBox} sq ft/box` : ''}</span>
                          </div>
                        )}

                        {product.piecesPerBox > 0 && product.quantity > 0 && (
                          <div className="product-boxes">
                            <span className="label">Total Boxes:</span>
                            <span className="value">{Math.ceil(product.quantity / product.piecesPerBox)}</span>
                          </div>
                        )}

                        {product.boxesPerPallet > 0 && product.piecesPerBox > 0 && product.quantity > 0 && (
                          <div className="product-pallets">
                            <span className="label">Palletizing:</span>
                            <span className="value">{product.boxesPerPallet} boxes/pallet → {Math.ceil(Math.ceil(product.quantity / product.piecesPerBox) / product.boxesPerPallet)} pallets needed</span>
                          </div>
                        )}

                        {product.description && (
                          <div className="product-description">
                            <span className="label">Description:</span>
                            <p className="value">{product.description}</p>
                          </div>
                        )}

                        {product.quantity > 0 && (
                          <div className="product-total">
                            <span className="label">Total Value:</span>
                            <span className="value highlight">${(product.price * product.quantity).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Series Management View */}
        {activeView === 'series' && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">All Series</h2>
              <button
                className="btn-primary"
                onClick={() => setActiveView('addSeries')}
              >
                ➕ Add Series
              </button>
            </div>

            {uniqueSeries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏷️</div>
                <p className="empty-title">No series yet</p>
                <p className="empty-description">Create series to organize your products</p>
                <button
                  className="btn-primary"
                  onClick={() => setActiveView('addSeries')}
                >
                  Add Your First Series
                </button>
              </div>
            ) : (
              <div className="product-grid">
                {uniqueSeries.map(series => {
                  const seriesObj = seriesData.find(s => s.name === series)
                  const productCount = metrics.seriesBreakdown[series] || 0

                  return (
                    <div key={series} className="product-card">
                      <div className="product-header">
                        <h3 className="product-name">{series}</h3>
                        <div className="product-actions">
                          <button
                            onClick={() => {
                              editSeries(series)
                              setActiveView('addSeries')
                            }}
                            className="edit-button"
                            title="Edit series"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteSeries(series)}
                            className="delete-button"
                            title="Delete series"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="product-details">
                        {seriesObj && seriesObj.description && (
                          <div className="product-description">
                            <span className="label">Description:</span>
                            <p className="value">{seriesObj.description}</p>
                          </div>
                        )}

                        <div className="product-quantity">
                          <span className="label">Products:</span>
                          <span className="value">{productCount}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Series View */}
        {activeView === 'addSeries' && (
          <div className="section">
            <div className="form-section">
              {editingSeriesId && (
                <div className="edit-mode-banner">
                  ✏️ Editing Series - Make changes and click Update
                </div>
              )}

              <h2 className="section-title">{editingSeriesId ? 'Edit Series' : 'Add New Series'}</h2>

              <div className="form-row">
                <input
                  type="text"
                  name="name"
                  value={seriesFormData.name}
                  onChange={handleSeriesInputChange}
                  onKeyPress={handleSeriesKeyPress}
                  placeholder="Series name *"
                  className="product-input"
                />
              </div>

              <div className="form-row">
                <input
                  type="text"
                  name="description"
                  value={seriesFormData.description}
                  onChange={handleSeriesInputChange}
                  placeholder="Description (optional)"
                  className="product-input description-input"
                />
              </div>

              <div className="button-row">
                <button onClick={editingSeriesId ? updateSeries : addNewSeries} className="btn-primary">
                  {editingSeriesId ? '✓ Update Series' : '+ Add Series'}
                </button>
                <button onClick={cancelSeriesEdit} className="btn-secondary">
                  ✕ Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mold Management View */}
        {activeView === 'molds' && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">All Molds</h2>
              <button
                className="btn-primary"
                onClick={() => setActiveView('addMold')}
              >
                ➕ Add Mold
              </button>
            </div>

            {moldsData.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔨</div>
                <p className="empty-title">No molds yet</p>
                <p className="empty-description">Add mold sizes available for production</p>
                <button
                  className="btn-primary"
                  onClick={() => setActiveView('addMold')}
                >
                  Add Your First Mold
                </button>
              </div>
            ) : (
              <div className="product-grid">
                {moldsData.map(mold => {
                  const tilesUsingMold = products.filter(p => p.size === mold.size).length

                  return (
                    <div key={mold.id} className="product-card">
                      <div className="product-header">
                        <h3 className="product-name">{mold.size}</h3>
                        <div className="product-actions">
                          <button
                            onClick={() => {
                              editMold(mold.id)
                              setActiveView('addMold')
                            }}
                            className="edit-button"
                            title="Edit mold"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteMold(mold.id)}
                            className="delete-button"
                            title="Delete mold"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="product-details">
                        {mold.description && (
                          <div className="product-description">
                            <span className="label">Description:</span>
                            <p className="value">{mold.description}</p>
                          </div>
                        )}

                        <div className="product-quantity">
                          <span className="label">Tiles Using:</span>
                          <span className="value">{tilesUsingMold}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Mold View */}
        {activeView === 'addMold' && (
          <div className="section">
            <div className="form-section">
              {editingMoldId && (
                <div className="edit-mode-banner">
                  ✏️ Editing Mold - Make changes and click Update
                </div>
              )}

              <h2 className="section-title">{editingMoldId ? 'Edit Mold' : 'Add New Mold'}</h2>

              <div className="form-row">
                <input
                  type="text"
                  name="size"
                  value={moldFormData.size}
                  onChange={handleMoldInputChange}
                  onKeyPress={handleMoldKeyPress}
                  placeholder="Mold size (e.g., 12x12, 6x6) *"
                  className="product-input"
                />
              </div>

              <div className="form-row">
                <input
                  type="text"
                  name="description"
                  value={moldFormData.description}
                  onChange={handleMoldInputChange}
                  placeholder="Description (optional)"
                  className="product-input description-input"
                />
              </div>

              <div className="button-row">
                <button onClick={editingMoldId ? updateMold : addNewMold} className="btn-primary">
                  {editingMoldId ? '✓ Update Mold' : '+ Add Mold'}
                </button>
                <button onClick={cancelMoldEdit} className="btn-secondary">
                  ✕ Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit View */}
        {activeView === 'add' && (
          <div className="section">
            <div className="form-section">
              {editingId && (
                <div className="edit-mode-banner">
                  ✏️ Editing Tile - Make changes and click Update
                </div>
              )}

              <h2 className="section-title">{editingId ? 'Edit Tile' : 'Add New Tile'}</h2>

              <div className="form-row">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Tile name *"
                  className="product-input"
                />

                <select
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  className="product-input"
                >
                  <option value="">Select Mold Size</option>
                  {moldsData.map(mold => (
                    <option key={mold.id} value={mold.size}>{mold.size}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="series-select-container">
                  <select
                    name="series"
                    value={showNewSeriesInput ? '__new__' : formData.series}
                    onChange={handleSeriesChange}
                    className="product-input series-select"
                  >
                    <option value="">Select Series/Category</option>
                    {uniqueSeries.map(series => (
                      <option key={series} value={series}>{series}</option>
                    ))}
                    <option value="__new__">+ Add New Series</option>
                  </select>

                  {showNewSeriesInput && (
                    <input
                      type="text"
                      value={newSeriesInput}
                      onChange={handleNewSeriesChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter new series name"
                      className="product-input new-series-input"
                      autoFocus
                    />
                  )}
                </div>

                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="product-input"
                >
                  <option value="sq ft">Square Feet (sq ft)</option>
                  <option value="pieces">Pieces</option>
                  <option value="linear ft">Linear Feet</option>
                  <option value="boxes">Boxes</option>
                </select>
              </div>

              <div className="form-row">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Price per unit *"
                  className="product-input price-input"
                  step="0.01"
                  min="0"
                />

                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Total quantity (pieces)"
                  className="product-input quantity-input"
                  min="0"
                />
              </div>

              <div className="form-row">
                <input
                  type="number"
                  name="piecesPerBox"
                  value={formData.piecesPerBox}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Pieces per box"
                  className="product-input"
                  min="0"
                />

                <input
                  type="number"
                  name="sqFtPerBox"
                  value={formData.sqFtPerBox}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Sq ft per box"
                  className="product-input"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="form-row">
                <input
                  type="number"
                  name="boxesPerPallet"
                  value={formData.boxesPerPallet}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Boxes per pallet"
                  className="product-input"
                  min="0"
                />

                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description (optional)"
                  className="product-input description-input"
                />
              </div>

              <div className="button-row">
                <button onClick={saveProduct} className="btn-primary">
                  {editingId ? '✓ Update Tile' : '+ Add Tile'}
                </button>
                <button onClick={cancelEdit} className="btn-secondary">
                  ✕ Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
