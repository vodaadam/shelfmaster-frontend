<template>
  <div class="view-container">
    <div class="header-nav">
      <h2>{{ categoryName || 'Category Detail' }}</h2>
      <button @click="goBack" class="back-btn">← Back</button>
    </div>

    <div class="toolbar">
      <button @click="openAddProduct">Add product</button>
      <button @click="openAddExisting">Add existing product</button>
      <button @click="showAddStock = true">Add stock</button>
    </div>

    <div v-if="loading" class="loading">Loading products...</div>
    <div v-else-if="products.length === 0" class="empty">No products found in this category.</div>

    <table v-else class="minimal-table">
      <thead>
      <tr>
        <th>Product Name</th>
        <th>Description (Preview)</th>
        <th style="width:150px;">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="product in products" :key="product.id">
        <td @click="openView(product)">{{ product.name }}</td>
        <td @click="openView(product)">{{ truncate(product.description, 50) }}</td>
        <td>
          <button @click.stop="openEdit(product)">Edit</button>
          <button @click.stop="deleteProduct(product.id)">Delete</button>
        </td>
      </tr>
      </tbody>
    </table>

    <!-- view-only modal (původní ProductModal) -->
    <ProductModal v-if="showView" :product="selectedProduct" @close="showView=false" />

    <!-- Add product (nový) -->
    <div v-if="showAddProduct" class="modal-backdrop" @click.self="showAddProduct=false">
      <div class="modal">
        <h3>New product</h3>
        <input v-model="newProduct.name" placeholder="Name">
        <textarea v-model="newProduct.description" placeholder="Description (optional)" />

        <h4>Stocks (unused)</h4>
        <div class="list-box">
          <label v-for="s in unusedStocks" :key="s.id">
            <input type="checkbox" :value="s.id" v-model="newProduct.stockIds">
            {{ s.warehouseSector }} ({{ s.quantity }})
          </label>
        </div>

        <div class="modal-actions">
          <button @click="createProduct">Save</button>
          <button @click="showAddProduct=false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Add existing product -->
    <div v-if="showAddExisting" class="modal-backdrop" @click.self="showAddExisting=false">
      <div class="modal">
        <h3>Add existing product</h3>
        <select v-model="existingProductId">
          <option disabled value="">Select product</option>
          <option v-for="p in allProducts" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
        <div class="modal-actions">
          <button @click="attachExisting">Add</button>
          <button @click="showAddExisting=false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Edit product: jméno, popis, stocky, kategorie -->
    <div v-if="showEdit" class="modal-backdrop" @click.self="showEdit=false">
      <div class="modal">
        <h3>Edit product</h3>
        <input v-model="editForm.name" placeholder="Name">
        <textarea v-model="editForm.description" placeholder="Description" />

        <h4>Categories</h4>
        <div class="list-box">
          <label v-for="c in allCategories" :key="c.id">
            <input type="checkbox" :value="c.id" v-model="editForm.categoryIds">
            {{ c.name }}
          </label>
        </div>

        <h4>Stocks</h4>
        <div class="list-box">
          <label v-for="s in allStocks" :key="s.id">
            <input type="checkbox" :value="s.id" v-model="editForm.stockIds">
            {{ s.warehouseSector }} ({{ s.quantity }})
          </label>
        </div>

        <div class="modal-actions">
          <button @click="updateProduct">Save</button>
          <button @click="showEdit=false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Add stock (jen vytvoří nový) -->
    <div v-if="showAddStock" class="modal-backdrop" @click.self="showAddStock=false">
      <div class="modal">
        <h3>New stock</h3>
        <input v-model="newStock.warehouseSector" placeholder="Warehouse sector">
        <input type="number" v-model.number="newStock.quantity" placeholder="Quantity">
        <div class="modal-actions">
          <button @click="createStock">Save</button>
          <button @click="showAddStock=false">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="flashError" class="toast">{{ flashError }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import ProductModal from '../components/ProductModal.vue'

const route = useRoute()
const router = useRouter()
const categoryId = route.params.id

const categoryName = ref('')
const products = ref([])
const loading = ref(true)

const showView = ref(false)
const selectedProduct = ref(null)

const showAddProduct = ref(false)
const newProduct = ref({ name: '', description: '', categoryIds: [], stockIds: [] })
const unusedStocks = ref([])

const showAddExisting = ref(false)
const existingProductId = ref('')
const allProducts = ref([])

const showEdit = ref(false)
const editForm = ref({ id: null, name: '', description: '', categoryIds: [], stockIds: [] })
const allCategories = ref([])
const allStocks = ref([])

const showAddStock = ref(false)
const newStock = ref({ warehouseSector: '', quantity: 0 })

const flashError = ref(null)
let flashTimeout = null
const showFlash = (msg) => {
  flashError.value = msg
  if (flashTimeout) clearTimeout(flashTimeout)
  flashTimeout = setTimeout(() => flashError.value = null, 3000)
}

const fetchData = async () => {
  try {
    const catResponse = await axios.get(`/categories/${categoryId}`)
    categoryName.value = catResponse.data.name
    const prodResponse = await axios.get(`/products/by-category/${categoryId}`)
    products.value = prodResponse.data
  } catch (err) {
    console.error(err)
    categoryName.value = "Error loading"
  } finally {
    loading.value = false
  }
}

const fetchUnusedStocks = async () => {
  const res = await axios.get('/stocks/unused')
  unusedStocks.value = res.data
}

const fetchAllProducts = async () => {
  const res = await axios.get('/products')
  allProducts.value = res.data
}

const fetchAllCategories = async () => {
  const res = await axios.get('/categories')
  allCategories.value = res.data
}

const fetchAllStocks = async () => {
  const res = await axios.get('/stocks')
  allStocks.value = res.data
}

const goBack = () => router.push('/')

const openView = (product) => {
  selectedProduct.value = product
  showView.value = true
}

const openAddProduct = async () => {
  await fetchUnusedStocks()
  newProduct.value = {
    name: '',
    description: '',
    categoryIds: [categoryId],
    stockIds: []
  }
  showAddProduct.value = true
}

const createProduct = async () => {
  try {
    await axios.post('/products', newProduct.value)
    showAddProduct.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
    showFlash(e.response?.data?.message || 'Create failed')
  }
}

const openAddExisting = async () => {
  await fetchAllProducts()
  existingProductId.value = ''
  showAddExisting.value = true
}

const attachExisting = async () => {
  if (!existingProductId.value) return
  try {
    // add product to category + category to product
    await axios.post(`/categories/${categoryId}/products/${existingProductId.value}`)
    await axios.post(`/products/${existingProductId.value}/categories/${categoryId}`)
    showAddExisting.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
    showFlash(e.response?.data?.message || 'Attach failed')
  }
}

const openEdit = async (p) => {
  await Promise.all([fetchAllCategories(), fetchAllStocks()])
  editForm.value = {
    id: p.id,
    name: p.name,
    description: p.description,
    categoryIds: [...(p.categoryIds || [])],
    stockIds: [...(p.stockIds || [])]
  }
  showEdit.value = true
}

const updateProduct = async () => {
  try {
    await axios.put(`/products/${editForm.value.id}`, {
      id: editForm.value.id,
      name: editForm.value.name,
      description: editForm.value.description,
      categoryIds: editForm.value.categoryIds,
      stockIds: editForm.value.stockIds
    })
    showEdit.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
    showFlash(e.response?.data?.message || 'Update failed')
  }
}

const deleteProduct = async (id) => {
  if (!confirm('Delete this product?')) return
  try {
    await axios.delete(`/products/${id}`)
    await fetchData()
  } catch (e) {
    console.error(e)
    showFlash(e.response?.data?.message || 'Delete failed')
  }
}

const createStock = async () => {
  try {
    await axios.post('/stocks', newStock.value)
    newStock.value = { warehouseSector: '', quantity: 0 }
    showAddStock.value = false
    // pro jistotu obnovíme nepoužité pro další create
    await fetchUnusedStocks()
  } catch (e) {
    console.error(e)
    showFlash(e.response?.data?.message || 'Stock create failed')
  }
}

const truncate = (str, n) => (str && str.length > n) ? str.substr(0, n - 1) + '...' : str

onMounted(fetchData)
</script>

<style scoped>
.view-container {
  background: #f5f7fb;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

/* Hlavička s back tlačítkem */
.header-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.header-nav h2 {
  margin: 0;
  font-weight: 600;
  font-size: 1.2rem;
  color: #111827;
}

.back-btn {
  background: #ffffff;
  border: 1px solid #d1d5db;
  padding: 7px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;
}

.back-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

/* Toolbar nad tabulkou */
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar button {
  cursor: pointer;
  border-radius: 999px;
  border: none;
  padding: 7px 16px;
  font-size: 0.85rem;
  font-weight: 500;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  box-shadow: 0 4px 10px rgba(5, 150, 105, 0.3);
  transition: transform 0.1s ease, box-shadow 0.1s ease, opacity 0.2s ease;
}

.toolbar button:nth-child(2) {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
}

.toolbar button:nth-child(3) {
  background: linear-gradient(135deg, #f97316, #ea580c);
  box-shadow: 0 4px 10px rgba(234, 88, 12, 0.3);
}

.toolbar button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(15, 118, 110, 0.35);
  opacity: 0.96;
}

/* Tabulka */
.minimal-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e1e5f0;
}

.minimal-table th,
.minimal-table td {
  padding: 14px 18px;
  text-align: left;
  border-bottom: 1px solid #edf0f7;
  font-size: 0.9rem;
}

.minimal-table th {
  background: linear-gradient(135deg, #f9fafb, #e0f2fe);
  font-weight: 600;
  color: #4b5563;
  text-transform: uppercase;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
}

.minimal-table tbody tr {
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.05s ease;
}

.minimal-table tbody tr:hover {
  background-color: #f1f5ff;
}

.minimal-table tbody tr:last-child td {
  border-bottom: none;
}

/* Action buttons v tabulce */
.minimal-table td button {
  border-radius: 999px;
  border: none;
  padding: 5px 10px;
  font-size: 0.78rem;
  margin-right: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: none;
}

.minimal-table td button:first-child {
  background: #eef2ff;
  color: #4338ca;
}

.minimal-table td button:first-child:hover {
  background: #e0e7ff;
}

.minimal-table td button:last-child {
  background: #fee2e2;
  color: #b91c1c;
}

.minimal-table td button:last-child:hover {
  background: #fecaca;
}

/* Empty text */
.empty {
  text-align: center;
  padding: 40px 10px;
  color: #9ca3af;
  font-style: italic;
  font-size: 0.9rem;
}

/* Modály */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: #ffffff;
  padding: 18px 20px;
  border-radius: 14px;
  min-width: 280px;
  max-width: 520px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.35);
  animation: popIn 0.18s ease-out;
}

.modal h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1rem;
  font-weight: 600;
}

.modal h4 {
  margin: 10px 0 6px;
  font-size: 0.86rem;
  font-weight: 600;
  color: #4b5563;
}

/* Inputs v modálu */
.modal input,
.modal textarea,
.modal select {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #d0d7e2;
  font-size: 0.9rem;
  outline: none;
  margin-bottom: 10px;
  transition: all 0.2s ease;
  background: #f9fafb;
}

.modal textarea {
  min-height: 80px;
  resize: vertical;
}

.modal input:focus,
.modal textarea:focus,
.modal select:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.modal select {
  cursor: pointer;
}

/* Checkbox list */
.list-box {
  max-height: 220px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  padding: 8px;
  border-radius: 8px;
  background: #f9fafb;
  margin-bottom: 8px;
}

.list-box label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  margin-bottom: 4px;
  cursor: pointer;
}

.list-box input[type='checkbox'] {
  accent-color: #2563eb;
}

/* Akce modálu */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.modal-actions button {
  border-radius: 999px;
  border: none;
  padding: 7px 14px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
}

.modal-actions button:last-child {
  background: #f3f4f6;
  color: #374151;
  box-shadow: none;
  border: 1px solid #e5e7eb;
}

.modal-actions button:last-child:hover {
  background: #e5e7eb;
}

/* Toast s chybou */
.toast {
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  color: #fff;
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 0.85rem;
  box-shadow: 0 8px 20px rgba(127, 29, 29, 0.4);
  z-index: 1100;
  animation: fadeInUp 0.18s ease-out;
}

/* Animace */
@keyframes popIn {
  from {
    transform: translateY(10px) scale(0.97);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsivita */
@media (max-width: 640px) {
  .view-container {
    padding: 16px;
  }
  .header-nav {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .minimal-table th,
  .minimal-table td {
    padding: 10px 12px;
  }
}
</style>

