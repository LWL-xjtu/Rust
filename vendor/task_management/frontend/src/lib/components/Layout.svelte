<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { navigating } from '$app/stores';
  import { apiClient } from '$lib/api/apiClient';
  import { authService } from '$lib/api/authService';
  
  let user: import('$lib/types').User | null = null;
  let loading = true;
  
  onMount(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      apiClient.setToken(token);
      try {
        const response = await authService.getCurrentUser();
        user = response;
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('token');
        apiClient.setToken(null);
      }
    }
    loading = false;
  });
  
  function logout() {
    localStorage.removeItem('token');
    apiClient.setToken(null);
    user = null;
    // Redirect to login page
    window.location.href = '/auth/login';
  }
</script>

<svelte:head>
  <title>Task Management</title>
  <meta name="description" content="Task Management Application" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <nav class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <h1 class="text-xl font-bold text-indigo-600">TaskFlow</h1>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <a href="/" class="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              Dashboard
            </a>
            <a href="/tasks" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              Tasks
            </a>
            <a href="/categories" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              Categories
            </a>
            <a href="/tags" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              Tags
            </a>
          </div>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:items-center">
          {#if user}
            <div class="ml-3 relative">
              <div class="flex items-center space-x-3">
                <span class="text-sm text-gray-700">{user.email}</span>
                <button
                  on:click={logout}
                  class="text-sm text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          {:else}
            <div class="flex space-x-4">
              <a href="/auth/login" class="text-gray-700 hover:text-gray-900 text-sm font-medium">
                Login
              </a>
              <a href="/auth/register" class="text-gray-700 hover:text-gray-900 text-sm font-medium">
                Register
              </a>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </nav>

  <main>
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {#if loading}
        <div class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      {:else}
        <slot></slot>
      {/if}
    </div>
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style>