<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { taskService } from '$lib/api/taskService';
  import { categoryService } from '$lib/api/categoryService';
  import Notification from '$lib/components/Notification.svelte';
  
  let title = '';
  let description = '';
  let completed = false;
  let categoryId: number | null = null;
  let categories: import('$lib/types').Category[] = [];
  let loading = false;
  let notification = {
    visible: false,
    message: '',
    type: 'info' as const
  };
  
  onMount(async () => {
    try {
      categories = await categoryService.getCategories();
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to fetch categories',
        type: 'error'
      };
    }
  });
  
  async function handleSubmit() {
    loading = true;
    notification.visible = false;
    
    try {
      const newTask = await taskService.createTask({
        title,
        description,
        completed,
        category_id: categoryId
      });
      
      notification = {
        visible: true,
        message: 'Task created successfully',
        type: 'success'
      };
      
      // Redirect to tasks list after a short delay
      setTimeout(() => {
        goto('/tasks');
      }, 1000);
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to create task',
        type: 'error'
      };
    } finally {
      loading = false;
    }
  }
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Create Task</h1>
  </div>
  
  <Notification 
    message={notification.message} 
    type={notification.type} 
    visible={notification.visible} 
  />
  
  <div class="bg-white shadow sm:rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <form class="space-y-6" on:submit|preventDefault={handleSubmit}>
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700">
            Title
          </label>
          <div class="mt-1">
            <input
              type="text"
              name="title"
              id="title"
              bind:value={title}
              required
              class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Task title"
            />
          </div>
        </div>
        
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">
            Description
          </label>
          <div class="mt-1">
            <textarea
              id="description"
              name="description"
              rows={3}
              bind:value={description}
              class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
              placeholder="Task description"
            ></textarea>
          </div>
        </div>
        
        <div>
          <label for="category" class="block text-sm font-medium text-gray-700">
            Category
          </label>
          <div class="mt-1">
            <select
              id="category"
              name="category"
              bind:value={categoryId}
              class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">No category</option>
              {#each categories as category}
                <option value={category.id}>{category.name}</option>
              {/each}
            </select>
          </div>
        </div>
        
        <div class="flex items-center">
          <input
            id="completed"
            name="completed"
            type="checkbox"
            bind:checked={completed}
            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label for="completed" class="ml-2 block text-sm text-gray-900">
            Mark as completed
          </label>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            on:click={() => goto('/tasks')}
            class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {#if loading}
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {/if}
            Create Task
          </button>
        </div>
      </form>
    </div>
  </div>
</div>