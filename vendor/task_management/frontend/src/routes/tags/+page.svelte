<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { tagService } from '$lib/api/tagService';
  import Notification from '$lib/components/Notification.svelte';
  
  let tags: import('$lib/types').Tag[] = [];
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
      tags = await tagService.getTags();
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to fetch tags',
        type: 'error'
      };
    } finally {
      loading = false;
    }
  }
  
  async function deleteTag(id: number) {
    if (!confirm('Are you sure you want to delete this tag?')) {
      return;
    }
    
    try {
      await tagService.deleteTag(id);
      
      // Remove the tag from the local array
      tags = tags.filter(tag => tag.id !== id);
      
      notification = {
        visible: true,
        message: 'Tag deleted successfully',
        type: 'success'
      };
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to delete tag',
        type: 'error'
      };
    }
  }
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Tags</h1>
    <button 
      on:click={() => goto('/tags/create')}
      class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <svg class="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Create Tag
    </button>
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
        {#each tags as tag}
          <li>
            <div class="px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <span 
                    class="inline-block w-3 h-3 rounded-full mr-2" 
                    style={`background-color: #${tag.color}`}
                  ></span>
                  <p class="text-sm font-medium text-gray-900">
                    {tag.name}
                  </p>
                </div>
              </div>
              <div class="mt-2 sm:flex sm:justify-between">
                <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <time datetime={tag.created_at}>
                    {new Date(tag.created_at).toLocaleDateString()}
                  </time>
                </div>
              </div>
              <div class="mt-2 flex space-x-2">
                <button 
                  on:click={() => goto(`/tags/${tag.id}/edit`)}
                  class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  Edit
                </button>
                <button 
                  on:click={() => deleteTag(tag.id)}
                  class="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        {:else}
          <li class="px-4 py-4 sm:px-6 text-center text-gray-500">
            No tags found. 
            <button 
              on:click={() => goto('/tags/create')}
              class="text-indigo-600 hover:text-indigo-900"
            >
              Create your first tag
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>