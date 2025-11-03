import { useState, useEffect } from 'react'
import './App.css'

const STORAGE_KEY = 'product-app-products'

function App() {
  // Load products from localStorage on initial render
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem(STORAGE_KEY)
    return savedProducts ? JSON.parse(savedProducts) : []
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

  // Save products to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  }, [products])

  // Get unique series from existing products
  const getUniqueSeries = () => {
    const seriesSet = new Set(products.map(p => p.series).filter(s => s))
    return Array.from(seriesSet).sort()
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
    // Scroll to form
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

  const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0)
  const uniqueSeries = getUniqueSeries()

  return (
    <div className="app">
      <div className="product-container">
        <h1>🛍️ Product Manager</h1>

        <div className="form-section">
          {editingId && (
            <div className="edit-mode-banner">
              ✏️ Editing Product - Make changes and click Update
            </div>
          )}

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
            <button onClick={saveProduct} className="add-button">
              {editingId ? '✓ Update Product' : '+ Add Product'}
            </button>
            {editingId && (
              <button onClick={cancelEdit} className="cancel-button">
                ✕ Cancel
              </button>
            )}
          </div>
        </div>

        <div className="stats">
          {products.length > 0 && (
            <p>{products.length} products • Total value: ${totalValue.toFixed(2)}</p>
          )}
        </div>

        <div className="product-grid">
          {products.map(product => (
            <div key={product.id} className={`product-card ${editingId === product.id ? 'editing' : ''}`}>
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
                    <span className="value">{product.quantity}</span>
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

        {products.length === 0 && (
          <div className="empty-state">
            <p>No products yet. Add your first product to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
