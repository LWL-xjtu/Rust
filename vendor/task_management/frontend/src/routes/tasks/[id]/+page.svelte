<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { taskService } from '$lib/api/taskService';
  import { categoryService } from '$lib/api/categoryService';
  import Notification from '$lib/components/Notification.svelte';
  
  let task: import('$lib/types').Task | null = null;
  let categories: import('$lib/types').Category[] = [];
  let loading = true;
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
  
  function getCategoryName(id: number | null) {
    if (!id) return 'No category';
    const category = categories.find(c => c.id === id);
    return category ? category.name : 'Unknown';
  }
  
  async function toggleTaskCompletion() {
    if (!task) return;
    
    try {
      const updatedTask = await taskService.updateTask(task.id, {
        completed: !task.completed
      });
      
      task = updatedTask;
      
      notification = {
        visible: true,
        message: `Task marked as ${updatedTask.completed ? 'completed' : 'pending'}`,
        type: 'success'
      };
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to update task',
        type: 'error'
      };
    }
  }
  
  async function deleteTask() {
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
    <h1 class="text-2xl font-bold text-gray-900">Task Details</h1>
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
    <div class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              type="checkbox"
              bind:checked={task.completed}
              on:change={toggleTaskCompletion}
              class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <h3 class="ml-3 text-lg leading-6 font-medium {task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}">
              {task.title}
            </h3>
          </div>
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {getCategoryName(task.category_id)}
          </span>
        </div>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">
          Created on {new Date(task.created_at).toLocaleDateString()}
        </p>
      </div>
      <div class="border-t border-gray-200">
        <dl>
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">
              Description
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {task.description || 'No description provided'}
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">
              Status
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {#if task.completed}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              {:else}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              {/if}
            </dd>
          </div>
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">
              Last updated
            </dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {new Date(task.updated_at).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>
      <div class="px-4 py-4 sm:px-6 flex justify-end space-x-3">
        <button
          on:click={() => goto(`/tasks/${task.id}/edit`)}
          class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Edit Task
        </button>
        <button
          on:click={deleteTask}
          class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Delete Task
        </button>
      </div>
    </div>
  {/if}
</div>