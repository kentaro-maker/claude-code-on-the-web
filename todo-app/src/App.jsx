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

  // Save products to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  }, [products])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addProduct = () => {
    if (formData.name.trim() !== '' && formData.price.trim() !== '') {
      const newProduct = {
        id: Date.now(),
        name: formData.name,
        price: parseFloat(formData.price),
        series: formData.series,
        description: formData.description,
        quantity: formData.quantity ? parseInt(formData.quantity) : 0
      }
      setProducts([...products, newProduct])
      setFormData({
        name: '',
        price: '',
        series: '',
        description: '',
        quantity: ''
      })
    }
  }

  const deleteProduct = (id) => {
    setProducts(products.filter(product => product.id !== id))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.name !== 'description') {
      addProduct()
    }
  }

  const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0)

  return (
    <div className="app">
      <div className="product-container">
        <h1>🛍️ Product Manager</h1>

        <div className="form-section">
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
            <input
              type="text"
              name="series"
              value={formData.series}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Series/Category"
              className="product-input series-input"
            />
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

          <button onClick={addProduct} className="add-button">
            Add Product
          </button>
        </div>

        <div className="stats">
          {products.length > 0 && (
            <p>{products.length} products • Total value: ${totalValue.toFixed(2)}</p>
          )}
        </div>

        <div className="product-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-header">
                <h3 className="product-name">{product.name}</h3>
                <button onClick={() => deleteProduct(product.id)} className="delete-button">
                  🗑️
                </button>
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
