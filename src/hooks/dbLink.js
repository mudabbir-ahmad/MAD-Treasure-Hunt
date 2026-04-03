import Constants from 'expo-constants';

const hostFromExpo = Constants.expoConfig?.hostUri?.split(':')[0] || null;
const apiBaseUrl = 'http://localhost:3000'; // Shirish, i need to deploy the database first so... wait until that... sorry buddy...
// if you want you can run your own db locally i can send you the files for it just ask :(((

const postJson = async (path, payload) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Request failed');
  }
  return result;
};

export const postDb = async (action, payload = {}) => {
  return postJson('/db', { action, payload });
};
