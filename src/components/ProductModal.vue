<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Product Details</h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <div class="info-group">
          <label>Name</label>
          <p class="value">{{ product.name }}</p>
        </div>

        <div class="info-group">
          <label>Description</label>
          <p class="value">{{ product.description || 'No description provided.' }}</p>
        </div>

        <hr>

        <h4>Stock Information</h4>

        <div v-if="loadingStock">Checking warehouse...</div>

        <div v-else-if="stockError" class="stock-error">
          {{ stockError }}
        </div>

        <div v-else-if="stocks.length === 0" class="stock-error">
          No stock assigned to this product.
        </div>

        <div v-else class="stock-grid-multi">
          <div
              v-for="s in stocks"
              :key="s.id"
              class="stock-card"
          >
            <div class="stock-card-header">
              <span class="stock-id">ID: {{ s.id }}</span>
              <div class="stock-card-actions">
                <button
                    class="icon-btn"
                    @click="openEditStock(s)"
                    title="Edit stock"
                >
                  ✎
                </button>
                <button
                    class="icon-btn danger"
                    @click="deleteStock(s)"
                    title="Delete stock"
                >
                  ×
                </button>
              </div>
            </div>

            <div class="info-group">
              <label>Warehouse Sector</label>
              <p class="value highlight">{{ s.warehouseSector }}</p>
            </div>
            <div class="info-group">
              <label>Quantity</label>
              <p class="value highlight">{{ s.quantity }} pcs</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal pro EDIT stocku -->
      <div
          v-if="showEditStock"
          class="inner-backdrop"
          @click.self="closeEditStock"
      >
        <div class="inner-modal">
          <h4>Edit stock</h4>

          <div class="info-group">
            <label>Warehouse sector</label>
            <input v-model="editStockForm.warehouseSector"/>
          </div>

          <div class="info-group">
            <label>Quantity</label>
            <input
                type="number"
                v-model.number="editStockForm.quantity"
            />
          </div>

          <div class="modal-actions">
            <button @click="saveEditStock">Save</button>
            <button @click="closeEditStock">Cancel</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import axios from 'axios'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const stocks = ref([])
const loadingStock = ref(true)
const stockError = ref(null)

const showEditStock = ref(false)
const editingStock = ref(null)
const editStockForm = ref({
  warehouseSector: '',
  quantity: 0
})

const fetchStocks = async () => {
  const ids = props.product.stockIds

  if (!ids || ids.length === 0) {
    loadingStock.value = false
    stocks.value = []
    return
  }

  try {
    const responses = await Promise.all(
        ids.map(id => axios.get(`/stocks/${id}`))
    )
    stocks.value = responses.map(r => r.data)
  } catch (err) {
    console.error('Error loading stocks', err)
    stockError.value =
        'Could not load stock information (Stock IDs might be invalid or DB empty).'
  } finally {
    loadingStock.value = false
  }
}

const openEditStock = (stock) => {
  editingStock.value = stock
  editStockForm.value = {
    warehouseSector: stock.warehouseSector,
    quantity: stock.quantity
  }
  showEditStock.value = true
}

const closeEditStock = () => {
  showEditStock.value = false
  editingStock.value = null
}

const saveEditStock = async () => {
  if (!editingStock.value) return
  try {
    const {data} = await axios.put(`/stocks/${editingStock.value.id}`, {
      warehouseSector: editStockForm.value.warehouseSector,
      quantity: editStockForm.value.quantity
    })

    // aktualizujeme lokální seznam stocks
    const idx = stocks.value.findIndex(s => s.id === editingStock.value.id)
    if (idx !== -1) {
      stocks.value[idx] = data
    }

    closeEditStock()
  } catch (err) {
    console.error('Error updating stock', err)
    alert(
        err.response?.data?.message ||
        'Failed to update stock.'
    )
  }
}

const deleteStock = async (stock) => {
  if (!confirm('Delete this stock?')) return
  try {
    await axios.delete(`/stocks/${stock.id}`)
    stocks.value = stocks.value.filter(s => s.id !== stock.id)
  } catch (err) {
    console.error('Error deleting stock', err)
    alert(
        err.response?.data?.message ||
        'Failed to delete stock.'
    )
  }
}

onMounted(fetchStocks)
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: 500px;
  max-width: 90%;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  background: #f8f9fa;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2em;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #888;
}

.modal-body {
  padding: 20px;
}

.info-group {
  margin-bottom: 15px;
}

.info-group label {
  display: block;
  font-size: 0.8em;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 4px;
}

.value {
  margin: 0;
  font-weight: 500;
  color: #333;
}

.highlight {
  font-size: 1.1em;
  color: #2980b9;
}

.stock-error {
  color: orange;
  font-style: italic;
  font-size: 0.9em;
}

.stock-grid-multi {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stock-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px 12px;
  background: #f9fafb;
}

.stock-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.stock-id {
  font-size: 0.7rem;
  color: #9ca3af;
}

.stock-card-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  border: none;
  background: #e5e7eb;
  border-radius: 999px;
  width: 22px;
  height: 22px;
  padding: 0;
  line-height: 1;
  font-size: 0.8rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, transform 0.1s ease;
}

.icon-btn:hover {
  background: #d1d5db;
  transform: translateY(-1px);
}

.icon-btn.danger {
  background: #fee2e2;
  color: #b91c1c;
}

.icon-btn.danger:hover {
  background: #fecaca;
}

.inner-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.inner-modal {
  background: #fff;
  padding: 16px 18px;
  border-radius: 10px;
  min-width: 260px;
  max-width: 360px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.inner-modal h4 {
  margin-top: 0;
  margin-bottom: 12px;
}

.inner-modal input {
  width: 100%;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.modal-actions button {
  border-radius: 999px;
  border: none;
  padding: 6px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-actions button:first-child {
  background: #2563eb;
  color: #fff;
}

.modal-actions button:last-child {
  background: #e5e7eb;
  color: #374151;
}
</style>
