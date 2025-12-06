<template>
  <div class="view-container">
    <h2>Categories</h2>

    <div v-if="loading" class="loading">Loading categories...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <table v-else class="minimal-table">
      <thead>
      <tr>
        <th>Category Name</th>
        <th style="text-align: right;">ID</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="category in categories" :key="category.id" @click="goToCategory(category.id)">
        <td>{{ category.name }}</td>
        <td style="text-align: right; color: #999; font-size: 0.8em;">{{ category.id.substring(0, 8) }}...</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const categories = ref([])
const loading = ref(true)
const error = ref(null)
const router = useRouter()

const fetchCategories = async () => {
  try {
    const response = await axios.get('/categories')
    categories.value = response.data
  } catch (err) {
    error.value = 'Failed to load categories. Is the backend running?'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const goToCategory = (id) => {
  router.push({ name: 'category-detail', params: { id } })
}

onMounted(() => {
  fetchCategories()
})
</script>

<style>
/* Sdílené styly pro tabulky */
.minimal-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
}
.minimal-table th, .minimal-table td {
  padding: 15px 20px;
  text-align: left;
  border-bottom: 1px solid #eee;
}
.minimal-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  font-size: 0.85em;
  letter-spacing: 0.05em;
}
.minimal-table tbody tr {
  cursor: pointer;
  transition: background-color 0.2s;
}
.minimal-table tbody tr:hover {
  background-color: #f0f7ff;
}
.loading, .error {
  text-align: center;
  padding: 20px;
  color: #666;
}
.error { color: #e74c3c; }
</style>