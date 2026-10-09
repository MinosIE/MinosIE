<script setup lang="ts">
import AnimatedResume from './pages/AnimatedResume.vue'

// MinosIE 以动画简历为首页；返回按钮在此语义下重播简历
function onBack() {
  location.reload()
}
</script>

<template>
  <AnimatedResume @back="onBack" />
</template>
