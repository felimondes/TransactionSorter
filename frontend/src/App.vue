<script setup lang="ts">
import { ref } from 'vue'
import Transaction from "./Transaction.vue";

const count = ref(0)
</script>

<template>
  <Transaction title="MOT" :liste="['item1', 'item2']" />
  <Transaction title="NIG"/>
  <Transaction title="GER" />
  <Transaction title="FELI" />
</template>

<style scoped>
</style>

