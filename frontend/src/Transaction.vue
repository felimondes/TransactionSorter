<script setup lang="ts">

  import {ref} from "vue";

  defineProps({
    title: String,
    liste: Array
  })

  const count = ref(props.liste)

  function add () {
    props.liste.add("ny")
  }
</script>

<template>
  <div>
    <button onclick="add">

    </button>
    <li v-for="item in liste">
      {{ item }}
    </li>
    <h1>transaction {{title}}</h1>
  </div>
</template>

<style scoped>
  body {
    background-color :red;
  }
</style>