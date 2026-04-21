<script lang="ts">
  import { goto } from '$app/navigation';
  import { tagService } from '$lib/api/tagService';
  import Notification from '$lib/components/Notification.svelte';
  
  let name = '';
  let color = '000000';
  let loading = false;
  let notification = {
    visible: false,
    message: '',
    type: 'info' as const
  };
  
  async function handleSubmit() {
    loading = true;
    notification.visible = false;
    
    try {
      const newTag = await tagService.createTag({
        name,
        color
      });
      
      notification = {
        visible: true,
        message: 'Tag created successfully',
        type: 'success'
      };
      
      // Redirect to tags list after a short delay
      setTimeout(() => {
        goto('/tags');
      }, 1000);
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to create tag',
        type: 'error'
      };
    } finally {
      loading = false;
    }
  }
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Create Tag</h1>
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
          <label for="name" class="block text-sm font-medium text-gray-700">
            Name
          </label>
          <div class="mt-1">
            <input
              type="text"
              name="name"
              id="name"
              bind:value={name}
              required
              class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Tag name"
            />
          </div>
        </div>
        
        <div>
          <label for="color" class="block text-sm font-medium text-gray-700">
            Color
          </label>
          <div class="mt-1 flex items-center">
            <input
              type="color"
              name="color"
              id="color"
              bind:value={color}
              class="h-10 w-10 border-0 rounded cursor-pointer"
            />
            <span class="ml-3 text-sm text-gray-500">#{color}</span>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            on:click={() => goto('/tags')}
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
            Create Tag
          </button>
        </div>
      </form>
    </div>
  </div>
</div>