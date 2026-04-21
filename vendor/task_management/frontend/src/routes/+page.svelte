<script lang="ts">
  import { onMount } from 'svelte';
  import { taskService } from '$lib/api/taskService';
  import { categoryService } from '$lib/api/categoryService';
  import { tagService } from '$lib/api/tagService';
  
  let tasks: import('$lib/types').Task[] = [];
  let categories: import('$lib/types').Category[] = [];
  let tags: import('$lib/types').Tag[] = [];
  let loading = true;
  
  onMount(async () => {
    try {
      // Fetch data in parallel
      const [tasksData, categoriesData, tagsData] = await Promise.all([
        taskService.getTasks(),
        categoryService.getCategories(),
        tagService.getTags()
      ]);
      
      tasks = tasksData;
      categories = categoriesData;
      tags = tagsData;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      loading = false;
    }
  });
</script>

<h1 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

{#if loading}
  <div class="flex justify-center items-center h-64">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
{:else}
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-indigo-500 rounded-md p-3">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
              <dd class="flex items-baseline">
                <div class="text-2xl font-semibold text-gray-900">{tasks.length}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Completed Tasks</dt>
              <dd class="flex items-baseline">
                <div class="text-2xl font-semibold text-gray-900">{tasks.filter(t => t.completed).length}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-yellow-500 rounded-md p-3">
            <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Pending Tasks</dt>
              <dd class="flex items-baseline">
                <div class="text-2xl font-semibold text-gray-900">{tasks.filter(t => !t.completed).length}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="mt-8">
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-medium text-gray-900">Recent Tasks</h2>
      <a href="/tasks" class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
        View all tasks
      </a>
    </div>
    
    <div class="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        {#each tasks.slice(0, 5) as task}
          <li>
            <a href={`/tasks/${task.id}`} class="block hover:bg-gray-50">
              <div class="px-4 py-4 sm:px-6">
                <div class="flex items-center justify-between">
                  <p class="text-sm font-medium text-indigo-600 truncate">
                    {task.title}
                  </p>
                  <div class="ml-2 flex-shrink-0 flex">
                    {#if task.completed}
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Completed
                      </span>
                    {:else}
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    {/if}
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
              </div>
            </a>
          </li>
        {:else}
          <li class="px-4 py-4 sm:px-6 text-center text-gray-500">
            No tasks found
          </li>
        {/each}
      </ul>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style>