import { useState, useEffect } from 'react'
import './App.css'

const STORAGE_KEY = 'product-app-products'
const SERIES_STORAGE_KEY = 'product-app-series'

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

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    series: '',
    description: '',
    quantity: ''
  })

  const [editingId, setEditingId] = useState(null)
  const [newSeriesInput, setNewSeriesInput] = useState('')
  const [showNewSeriesInput, setShowNewSeriesInput] = useState(false)
  const [activeView, setActiveView] = useState('overview') // 'overview', 'add', 'series', or 'addSeries'

  // Series management state
  const [editingSeriesId, setEditingSeriesId] = useState(null)
  const [seriesFormData, setSeriesFormData] = useState({
    name: '',
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
                quantity: formData.quantity ? parseInt(formData.quantity) : 0
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
          quantity: formData.quantity ? parseInt(formData.quantity) : 0
        }
        setProducts([...products, newProduct])
      }

      // Reset form
      setFormData({
        name: '',
        price: '',
        series: '',
        description: '',
        quantity: ''
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
      quantity: product.quantity.toString()
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
      quantity: ''
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
          <h2 className="sidebar-title">📦 Product Hub</h2>
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
            className={`nav-item ${activeView === 'add' ? 'active' : ''}`}
            onClick={() => setActiveView('add')}
          >
            <span className="nav-icon">➕</span>
            <span>{editingId ? 'Edit Product' : 'Add Product'}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="quick-stats">
            <p className="quick-stat-label">Total Products</p>
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
              {activeView === 'overview' && 'Product Management Dashboard'}
              {activeView === 'series' && 'Series Management'}
              {activeView === 'addSeries' && (editingSeriesId ? 'Edit Series' : 'Add New Series')}
              {activeView === 'add' && (editingId ? 'Edit Product' : 'Add New Product')}
            </h1>
            <p className="dashboard-subtitle">
              {activeView === 'overview' && 'Monitor and manage your product inventory'}
              {activeView === 'series' && 'Manage your product series and categories'}
              {activeView === 'addSeries' && 'Fill in the series details below'}
              {activeView === 'add' && 'Fill in the product details below'}
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
                <div className="metric-icon">📦</div>
                <div className="metric-content">
                  <p className="metric-label">Total Products</p>
                  <p className="metric-value">{products.length}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                  <p className="metric-label">Total Quantity</p>
                  <p className="metric-value">{metrics.totalQuantity}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">💵</div>
                <div className="metric-content">
                  <p className="metric-label">Avg Price</p>
                  <p className="metric-value">${metrics.avgPrice.toFixed(2)}</p>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">🏷️</div>
                <div className="metric-content">
                  <p className="metric-label">Series Count</p>
                  <p className="metric-value">{metrics.uniqueSeries}</p>
                </div>
              </div>

              <div className="metric-card alert">
                <div className="metric-icon">⚠️</div>
                <div className="metric-content">
                  <p className="metric-label">Low Stock</p>
                  <p className="metric-value">{metrics.lowStock}</p>
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

            {/* Products Table */}
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">All Products</h2>
                <button
                  className="btn-primary"
                  onClick={() => setActiveView('add')}
                >
                  ➕ Add Product
                </button>
              </div>

              {products.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📦</div>
                  <p className="empty-title">No products yet</p>
                  <p className="empty-description">Get started by adding your first product</p>
                  <button
                    className="btn-primary"
                    onClick={() => setActiveView('add')}
                  >
                    Add Your First Product
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

                        <div className="product-price">
                          <span className="label">Price:</span>
                          <span className="value">${product.price.toFixed(2)}</span>
                        </div>

                        {product.quantity > 0 && (
                          <div className="product-quantity">
                            <span className="label">Quantity:</span>
                            <span className={`value ${product.quantity < 10 ? 'low-stock' : ''}`}>
                              {product.quantity}
                              {product.quantity < 10 && <span className="low-stock-badge">Low</span>}
                            </span>
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
                            <span className="label">Total:</span>
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
              <div className="series-management-grid">
                {uniqueSeries.map(series => {
                  const seriesObj = seriesData.find(s => s.name === series)
                  const productCount = metrics.seriesBreakdown[series] || 0

                  return (
                    <div key={series} className="series-management-card">
                      <div className="series-info">
                        <h3 className="series-management-name">{series}</h3>
                        {seriesObj && seriesObj.description && (
                          <p className="series-description">{seriesObj.description}</p>
                        )}
                        <p className="series-product-count">
                          {productCount} product{productCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="series-actions">
                        <button
                          onClick={() => {
                            editSeries(series)
                            setActiveView('addSeries')
                          }}
                          className="edit-button"
                          title="Edit series"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteSeries(series)}
                          className="delete-button"
                          title="Delete series"
                        >
                          🗑️ Delete
                        </button>
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

        {/* Add/Edit View */}
        {activeView === 'add' && (
          <div className="section">
            <div className="form-section">
              {editingId && (
                <div className="edit-mode-banner">
                  ✏️ Editing Product - Make changes and click Update
                </div>
              )}

              <h2 className="section-title">{editingId ? 'Edit Product' : 'Add New Product'}</h2>

              <div className="form-row">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Product name *"
                  className="product-input"
                />

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

                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Price *"
                  className="product-input price-input"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="form-row">
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Quantity"
                  className="product-input quantity-input"
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
                  {editingId ? '✓ Update Product' : '+ Add Product'}
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
