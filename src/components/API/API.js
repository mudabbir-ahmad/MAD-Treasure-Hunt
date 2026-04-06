import Constants from 'expo-constants';

const getBaseUrl = () => {
    // In Expo Go the debuggerHost is "192.168.x.x:8081" — grab the IP
    const debuggerHost = Constants.expoGoConfig?.debuggerHost;
    if (debuggerHost) {
        const ip = debuggerHost.split(':')[0];
        return `http://${ip}:3000`;
    }
    // Fallback for web / production
    return 'http://localhost:3000';
};

export const API_BASE_URL = getBaseUrl();
//export const API_BASE_URL = 'http://api.bobby.ip-ddns.com'; // Production server URL

const API = {};

API.get = (endpoint) => callFetch(endpoint, 'GET');
API.post = (endpoint, data) => callFetch(endpoint, 'POST', data);
API.put = (endpoint, data) => callFetch(endpoint, 'PUT', data);
API.delete = (endpoint) => callFetch(endpoint, 'DELETE');

export default API;

const callFetch = async (endpoint, method, dataObj = null) => {
    // Build request object
    let requestObj = {method: method}; // GET, POST, PUT or DELETE
    if (dataObj)
        requestObj = {
            ...requestObj,
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify(dataObj),
        };

    // Call the fetch and process the return
    try {
        let result = null;
        const response = await fetch(endpoint, requestObj);
        if (response.status !== 204) result = await response.json();
        return response.status >= 200 && response.status < 300
            ? {isSuccess: true, result}
            : {isSuccess: false, message: `${result.message}`};
    } catch (error) {
        return {isSuccess: false, message: error.message};
    }
};

