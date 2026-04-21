<script lang="ts">
  import { onMount } from 'svelte';
  import { taskService } from '$lib/api/taskService';
  import { categoryService } from '$lib/api/categoryService';
  import Notification from '$lib/components/Notification.svelte';
  
  let tasks: import('$lib/types').Task[] = [];
  let categories: import('$lib/types').Category[] = [];
  let loading = true;
  let notification = {
    visible: false,
    message: '',
    type: 'info' as const
  };
  
  onMount(async () => {
    await fetchData();
  });
  
  async function fetchData() {
    try {
      loading = true;
      // Fetch tasks and categories in parallel
      const [tasksData, categoriesData] = await Promise.all([
        taskService.getTasks(),
        categoryService.getCategories()
      ]);
      
      tasks = tasksData;
      categories = categoriesData;
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to fetch tasks',
        type: 'error'
      };
    } finally {
      loading = false;
    }
  }
  
  function getCategoryName(id: number | null) {
    if (!id) return 'No category';
    const category = categories.find(c => c.id === id);
    return category ? category.name : 'Unknown';
  }
  
  async function toggleTaskCompletion(task: import('$lib/types').Task) {
    try {
      const updatedTask = await taskService.updateTask(task.id, {
        completed: !task.completed
      });
      
      // Update the task in the local array
      const index = tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        tasks[index] = updatedTask;
      }
      
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
  
  async function deleteTask(id: number) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      await taskService.deleteTask(id);
      
      // Remove the task from the local array
      tasks = tasks.filter(task => task.id !== id);
      
      notification = {
        visible: true,
        message: 'Task deleted successfully',
        type: 'success'
      };
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
    <h1 class="text-2xl font-bold text-gray-900">Tasks</h1>
    <a 
      href="/tasks/create" 
      class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Create Task
    </a>
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
  {:else}
    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        {#each tasks as task}
          <li>
            <div class="px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <input
                    type="checkbox"
                    bind:checked={task.completed}
                    on:change={() => toggleTaskCompletion(task)}
                    class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <p class="ml-3 text-sm font-medium {task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}">
                    {task.title}
                  </p>
                </div>
                <div class="ml-2 flex-shrink-0 flex">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {getCategoryName(task.category_id)}
                  </span>
                </div>
              </div>
              <div class="mt-2 sm:flex sm:justify-between">
                <div class="sm:flex">
                  <p class="flex items-center text-sm text-gray-500">
                    {task.description}
                  </p>
                </div>
                <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <time datetime={task.created_at}>
                    {new Date(task.created_at).toLocaleDateString()}
                  </time>
                </div>
              </div>
              <div class="mt-2 flex space-x-2">
                <a 
                  href={`/tasks/${task.id}/edit`} 
                  class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  Edit
                </a>
                <button 
                  on:click={() => deleteTask(task.id)}
                  class="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        {:else}
          <li class="px-4 py-4 sm:px-6 text-center text-gray-500">
            No tasks found. 
            <a href="/tasks/create" class="text-indigo-600 hover:text-indigo-900">
              Create your first task
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>