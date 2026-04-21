<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authService } from '$lib/api/authService';
  import { apiClient } from '$lib/api/apiClient';
  import Notification from '$lib/components/Notification.svelte';
  
  type NotificationType = 'info' | 'success' | 'error' | 'warning';
  
  let username = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let loading = false;
  let notification = {
    visible: false,
    message: '',
    type: 'info' as NotificationType
  };
  
  onMount(() => {
    // Redirect if already logged in
    const token = localStorage.getItem('token');
    if (token) {
      goto('/');
    }
  });
  
  async function handleSubmit() {
    if (password !== confirmPassword) {
      notification = {
        visible: true,
        message: 'Passwords do not match',
        type: 'error'
      };
      return;
    }
    
    loading = true;
    notification.visible = false;
    
    try {
      const response = await authService.register({ username, email, password });
      localStorage.setItem('token', response.token);
      apiClient.setToken(response.token);
      goto('/');
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to register',
        type: 'error'
      };
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Create your account
      </h2>
    </div>
    
    <Notification 
      message={notification.message} 
      type={notification.type} 
      visible={notification.visible} 
    />
    
    <form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
      <div class="rounded-md shadow-sm -space-y-px">
        <div>
          <label for="username" class="sr-only">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autocomplete="username"
            required
            bind:value={username}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Username"
          />
        </div>
        <div>
          <label for="email-address" class="sr-only">Email address</label>
          <input
            id="email-address"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>
        <div>
          <label for="password" class="sr-only">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="new-password"
            required
            bind:value={password}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Password"
          />
        </div>
        <div>
          <label for="confirm-password" class="sr-only">Confirm Password</label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autocomplete="new-password"
            required
            bind:value={confirmPassword}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Confirm Password"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          {/if}
          Register
        </button>
      </div>
    </form>
    
    <div class="text-center">
      <p class="text-sm text-gray-600">
        Already have an account? 
        <a href="/auth/login" class="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in here
        </a>
      </p>
    </div>
  </div>
</div>