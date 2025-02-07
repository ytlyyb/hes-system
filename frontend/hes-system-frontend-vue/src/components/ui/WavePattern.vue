<script setup lang="ts">
// Component for decorative wave patterns in the login page background
</script>

<template>
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <svg class="absolute top-0 left-0 w-full h-full" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Top right decorative circle -->
      <circle cx="1300" cy="150" r="100" fill="white" fill-opacity="0.1" />
      
      <!-- Bottom left wave -->
      <path d="M0 600 C300 550 400 650 600 600 C800 550 900 650 1440 600 V900 H0 V600Z" 
            fill="white" 
            fill-opacity="0.05" />
      
      <!-- Top left wave -->
      <path d="M0 0 C200 50 300 0 500 50 C700 100 800 0 1000 50 L1000 0 H0 V0Z" 
            fill="white" 
            fill-opacity="0.05" />
            
      <!-- Small decorative circles -->
      <circle cx="100" cy="100" r="20" fill="white" fill-opacity="0.1" />
      <circle cx="1200" cy="400" r="15" fill="white" fill-opacity="0.1" />
      <circle cx="300" cy="700" r="25" fill="white" fill-opacity="0.1" />
    </svg>
  </div>
</template>
