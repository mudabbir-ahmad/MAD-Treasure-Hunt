// This file contains functions to interact with the API or local database.

const API_BASE_URL = 'http://localhost:3000'; // Change this to the actual API endpoint when needed

// Generic fetch function
const APIFetch = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// Example function to fetch a user by username
const fetchUserByUsername = async (username) => {
  return await APIFetch(`users?username=${username}`);
};

// Example function to fetch all groups
const fetchGroups = async () => {
  return await APIFetch('groups');
};

// Example function to fetch subgroups by group ID
const fetchSubgroupsByGroupId = async (groupId) => {
  return await APIFetch(`groups/${groupId}/subgroups`);
};

// RESTful API functions
const fetchItems = async (endpoint) => await APIFetch(endpoint);
const createItem = async (endpoint, data) => await APIFetch(endpoint, { method: 'POST', body: JSON.stringify(data) });
const updateItem = async (endpoint, data) => await APIFetch(endpoint, { method: 'PUT', body: JSON.stringify(data) });
const deleteItem = async (endpoint) => await APIFetch(endpoint, { method: 'DELETE' });

export { APIFetch, fetchUserByUsername, fetchGroups, fetchSubgroupsByGroupId, fetchItems, createItem, updateItem, deleteItem };
