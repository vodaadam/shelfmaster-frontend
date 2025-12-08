<template>
  <div class="view-container">
    <h2>Categories</h2>

    <div class="toolbar">
      <button @click="showAddCat = true">Add category</button>
      <div class="min-stock">
        <input type="number" v-model.number="minTotalStock" placeholder="Min total stock">
        <button @click="filterByStock">Filter</button>
        <button @click="fetchCategories">Reset</button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading categories...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <table v-else class="minimal-table">
      <thead>
      <tr>
        <th>Category Name</th>
        <th style="text-align:right;">ID</th>
        <th style="width:140px;">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="category in categories" :key="category.id">
        <td @click="goToCategory(category.id)">{{ category.name }}</td>
        <td @click="goToCategory(category.id)" style="text-align:right;color:#999;font-size:.8em;">
          {{ category.id.substring(0, 8) }}...
        </td>
        <td>
          <button @click.stop="openEditCat(category)">Edit</button>
          <button @click.stop="deleteCategory(category.id)">Delete</button>
        </td>
      </tr>
      </tbody>
    </table>

    <!-- Add category -->
    <div v-if="showAddCat" class="modal-backdrop" @click.self="showAddCat=false">
      <div class="modal">
        <h3>New category</h3>
        <input v-model="newCatName" placeholder="Name">
        <div class="modal-actions">
          <button @click="createCategory">Save</button>
          <button @click="showAddCat=false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Edit category (jméno + produkty) -->
    <div v-if="showEditCat" class="modal-backdrop" @click.self="showEditCat=false">
      <div class="modal">
        <h3>Edit category</h3>
        <input v-model="editCat.name" placeholder="Name">

        <h4>Products in category</h4>
        <div class="list-box">
          <label v-for="p in allProducts" :key="p.id" class="product-label">
            <input type="checkbox" :value="p.id" v-model="editCat.productIds">
            <span class="product-label-text">
                {{ p.name }} ({{ p.id.substring(0, 8) }}...)
            </span>
          </label>
        </div>


        <div class="modal-actions">
          <button @click="updateCategory">Save</button>
          <button @click="showEditCat=false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- krátká hláška z backendu -->
    <div v-if="flashError" class="toast">{{ flashError }}</div>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import axios from 'axios'
import {useRouter} from 'vue-router'

const categories = ref([])
const loading = ref(true)
const error = ref(null)
const router = useRouter()

const showAddCat = ref(false)
const newCatName = ref('')

const showEditCat = ref(false)
const editCat = ref({id: null, name: '', productIds: []})
const allProducts = ref([])

const minTotalStock = ref(null)
const flashError = ref(null)
let flashTimeout = null

const showFlash = (msg) => {
  flashError.value = msg
  if (flashTimeout) clearTimeout(flashTimeout)
  flashTimeout = setTimeout(() => flashError.value = null, 3000)
}

const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await axios.get('/categories')
    categories.value = res.data
    error.value = null
  } catch (e) {
    error.value = 'Failed to load categories.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

const createCategory = async () => {
  try {
    await axios.post('/categories', {name: newCatName.value, productIds: []})
    showAddCat.value = false
    newCatName.value = ''
    await fetchCategories()
  } catch (e) {
    console.error(e)
    showFlash(e.response?.data?.message || 'Create failed')
  }
}

const deleteCategory = async (id) => {
  if (!confirm('Delete this category?')) return
  try {
    await axios.delete(`/categories/${id}`)
    await fetchCategories()
  } catch (e) {
    console.error(e)
    showFlash(e.response?.data?.message || 'Delete failed')
  }
}

const openEditCat = async (cat) => {
  editCat.value = {
    id: cat.id,
    name: cat.name,
    productIds: [...(cat.productIds || [])]
  }

  showEditCat.value = true

  try {
    const res = await axios.get('/products')
    allProducts.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.error('Error loading products', e.response || e)
    showFlash(e.response?.data?.message || 'Cannot load products')
    allProducts.value = []
  }
}

const updateCategory = async () => {
  try {
    await axios.put(`/categories/${editCat.value.id}`, {
      id: editCat.value.id,
      name: editCat.value.name,
      productIds: editCat.value.productIds
    })
    showEditCat.value = false
    await fetchCategories()
  } catch (e) {
    console.error(e)
    showFlash(e.response?.data?.message || 'Update failed')
  }
}

const filterByStock = async () => {
  if (minTotalStock.value == null || minTotalStock.value < 0) return
  loading.value = true
  try {
    const res = await axios.get('/categories/by-total-stock', {
      params: {minTotalStock: minTotalStock.value}
    })
    categories.value = res.data
    error.value = null
  } catch (e) {
    console.error(e)
    showFlash(e.response?.data?.message || 'Filter failed')
  } finally {
    loading.value = false
  }
}

const goToCategory = (id) => {
  router.push({name: 'category-detail', params: {id}})
}

onMounted(fetchCategories)
</script>

<style scoped>
.view-container {
  background: #f5f7fb;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

/* Nadpis */
h2 {
  margin-top: 0;
  margin-bottom: 18px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  font-size: 0.95rem;
  color: #6c7a89;
}

/* Toolbar nad tabulkou */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 10px;
  flex-wrap: wrap;
}

.min-stock {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.min-stock input {
  width: 140px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid #d0d7e2;
  font-size: 0.85rem;
  outline: none;
  transition: all 0.2s ease;
  background: #fff;
}

.min-stock input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

/* Obecné tlačítko */
button {
  cursor: pointer;
  border-radius: 999px;
  border: none;
  padding: 7px 16px;
  font-size: 0.85rem;
  font-weight: 500;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
  transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.2s ease, opacity 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.35);
  opacity: 0.96;
}

button:active {
  transform: translateY(0);
  box-shadow: 0 3px 6px rgba(37, 99, 235, 0.35);
}

button:nth-child(2),
button:nth-child(3) {
  background: #ffffff;
  color: #2563eb;
  border: 1px solid #d0e1ff;
  box-shadow: none;
}

button:nth-child(2):hover,
button:nth-child(3):hover {
  background: #eff4ff;
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
  background: linear-gradient(135deg, #f9fafb, #eef2ff);
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

/* Loading / error */
.loading,
.error {
  text-align: center;
  padding: 24px 10px;
  color: #6b7280;
  font-size: 0.9rem;
}

.error {
  color: #dc2626;
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
  max-width: 420px;
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

.modal input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #d0d7e2;
  font-size: 0.9rem;
  outline: none;
  margin-bottom: 10px;
  transition: all 0.2s ease;
}

.modal input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
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

/* Výběr produktů v kategorii */
.list-box {
  max-height: 220px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  padding: 8px;
  border-radius: 8px;
  background: #f9fafb;
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
  width: auto;
  margin-bottom: 0;
}

/* Toast */
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

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .min-stock {
    width: 100%;
  }

  .min-stock input {
    flex: 1;
  }
}
</style>

