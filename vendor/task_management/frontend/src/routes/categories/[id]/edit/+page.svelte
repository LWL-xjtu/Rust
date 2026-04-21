<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { categoryService } from '$lib/api/categoryService';
  import Notification from '$lib/components/Notification.svelte';
  
  let category: import('$lib/types').Category | null = null;
  let name = '';
  let description = '';
  let loading = true;
  let saving = false;
  let notification = {
    visible: false,
    message: '',
    type: 'info' as const
  };
  
  onMount(async () => {
    try {
      // Get category ID from URL params
      const categoryId = parseInt(page.params.id);
      
      if (isNaN(categoryId)) {
        throw new Error('Invalid category ID');
      }
      
      category = await categoryService.getCategory(categoryId);
      
      // Initialize form values
      name = category.name;
      description = category.description;
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to fetch category',
        type: 'error'
      };
    } finally {
      loading = false;
    }
  });
  
  async function handleSubmit() {
    if (!category) return;
    
    saving = true;
    notification.visible = false;
    
    try {
      const updatedCategory = await categoryService.updateCategory(category.id, {
        name,
        description
      });
      
      category = updatedCategory;
      
      notification = {
        visible: true,
        message: 'Category updated successfully',
        type: 'success'
      };
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to update category',
        type: 'error'
      };
    } finally {
      saving = false;
    }
  }
  
  async function handleDelete() {
    if (!category) return;
    
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }
    
    try {
      await categoryService.deleteCategory(category.id);
      goto('/categories');
    } catch (error: any) {
      notification = {
        visible: true,
        message: error.message || 'Failed to delete category',
        type: 'error'
      };
    }
  }
</script>

<div>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Edit Category</h1>
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
  {:else if category}
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
                placeholder="Category name"
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
                placeholder="Category description"
              ></textarea>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              on:click={() => goto('/categories')}
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
              Update Category
            </button>
            <button
              type="button"
              on:click={handleDelete}
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Category
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>