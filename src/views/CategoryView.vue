<template>
  <div class="view-container">
    <div class="header-nav">
      <h2>{{ categoryName || 'Category Detail' }}</h2>
      <button @click="goBack" class="back-btn">← Back</button>
    </div>

    <div v-if="loading" class="loading">Loading products...</div>
    <div v-else-if="products.length === 0" class="empty">No products found in this category.</div>

    <table v-else class="minimal-table">
      <thead>
      <tr>
        <th>Product Name</th>
        <th>Description (Preview)</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="product in products" :key="product.id" @click="openProductModal(product)">
        <td>{{ product.name }}</td>
        <td>{{ truncate(product.description, 50) }}</td>
      </tr>
      </tbody>
    </table>

    <ProductModal
        v-if="showModal"
        :product="selectedProduct"
        @close="showModal = false"
    />
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

const showModal = ref(false)
const selectedProduct = ref(null)

const fetchData = async () => {
  try {
    // 1. Získat název kategorie (pro levý horní roh)
    const catResponse = await axios.get(`/categories/${categoryId}`)
    categoryName.value = catResponse.data.name

    // 2. Získat produkty (používám endpoint z vašeho ProductControlleru)
    const prodResponse = await axios.get(`/products/by-data-table/${categoryId}`)
    products.value = prodResponse.data
  } catch (err) {
    console.error("Error fetching data", err)
    categoryName.value = "Error loading"
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/')
}

const openProductModal = (product) => {
  selectedProduct.value = product
  showModal.value = true
}

const truncate = (str, n) => {
  return (str && str.length > n) ? str.substr(0, n-1) + '...' : str;
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.header-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.back-btn {
  background: white;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.back-btn:hover {
  background: #f0f0f0;
  border-color: #bbb;
}
.empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-style: italic;
}
</style>