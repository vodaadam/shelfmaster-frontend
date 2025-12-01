<template>
  <div class="app-container">
    <header>
      <h1>Shelf Master</h1>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}
header h1 {
  font-weight: 300;
  text-align: center;
  margin-bottom: 40px;
  color: #2c3e50;
}
</style>