<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { taskService } from '$lib/api/taskService';
  import { categoryService } from '$lib/api/categoryService';
  import Notification from '$lib/components/Notification.svelte';
  
  let task: import('$lib/types').Task | null = null;
  let title = '';
  let description = '';
  let completed = false;
  let categoryId: number | null = null;
  let categories: import('$lib/types').Category[] = [];
  let loading = true;
  let saving = false;
  let notification = {
    visible: false,
    message: '',
    type: 'info' as const
  };
  
  onMount(async () => {
    try {
      // Get task ID from URL params
      const taskId = parseInt(page.params.id);
      
      if (isNaN(taskId)) {
        throw new Error('Invalid task ID');
      }
      
      // Fetch task and categories in parallel
      const [taskData, categoriesData] = await Promise.all([
        taskService.getTask(taskId),
        categoryService.getCategories()
      ]);
      
      task = taskData;
      categories = categoriesData;
      
      // Initialize form values
      title = task.title;
      description = task.description;
      completed = task.completed;
      categoryId = task.category_id;
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to fetch task',
        type: 'error'
      };
    } finally {
      loading = false;
    }
  });
  
  async function handleSubmit() {
    if (!task) return;
    
    saving = true;
    notification.visible = false;
    
    try {
      const updatedTask = await taskService.updateTask(task.id, {
        title,
        description,
        completed,
        category_id: categoryId
      });
      
      task = updatedTask;
      
      notification = {
        visible: true,
        message: 'Task updated successfully',
        type: 'success'
      };
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to update task',
        type: 'error'
      };
    } finally {
      saving = false;
    }
  }
  
  async function handleDelete() {
    if (!task) return;
    
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      await taskService.deleteTask(task.id);
      goto('/tasks');
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to delete task',
        type: 'error'
      };
    }
  }
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Edit Task</h1>
  </div>
  
  <Notification 
    message={notification.message} 
    type={notification.type} 
    visible={notification.visible} 
  />
  
  {#if loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  {:else if task}
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
              disabled={saving}
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {#if saving}
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              {/if}
              Update Task
            </button>
            <button
              type="button"
              on:click={handleDelete}
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Task
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>