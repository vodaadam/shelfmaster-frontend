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
        <div v-else class="stock-grid">
          <div class="info-group">
            <label>Warehouse Sector</label>
            <p class="value highlight">{{ stockData.warehouseSector }}</p>
          </div>
          <div class="info-group">
            <label>Quantity</label>
            <p class="value highlight">{{ stockData.quantity }} pcs</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const stockData = ref(null)
const loadingStock = ref(true)
const stockError = ref(null)

const fetchStock = async () => {
  if (!props.product.stockId) {
    loadingStock.value = false
    stockError.value = "No stock ID assigned to this product."
    // TODO: Zde backend vrací null stockId, pokud produkt nemá vazbu.
    return
  }

  try {
    const response = await axios.get(`/stocks/${props.product.stockId}`)
    stockData.value = response.data
  } catch (err) {
    console.error("Error loading stock", err)
    stockError.value = "Could not load stock information (Stock ID might be invalid or DB empty)."
  } finally {
    loadingStock.value = false
  }
}

onMounted(() => {
  fetchStock()
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
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
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  overflow: hidden;
  animation: slideIn 0.3s ease;
}
@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.modal-header {
  background: #f8f9fa;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}
.modal-header h3 { margin: 0; font-size: 1.2em; }
.close-btn {
  background: none; border: none; font-size: 1.5em; cursor: pointer; color: #888;
}
.modal-body { padding: 20px; }
.info-group { margin-bottom: 15px; }
.info-group label {
  display: block; font-size: 0.8em; text-transform: uppercase; color: #888; margin-bottom: 4px;
}
.value { margin: 0; font-weight: 500; color: #333; }
.highlight { font-size: 1.1em; color: #2980b9; }
.stock-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.stock-error { color: orange; font-style: italic; font-size: 0.9em; }
hr { border: 0; border-top: 1px solid #eee; margin: 20px 0; }
</style>