// Debug script to check what data is being sent in the form
// Add this to the browser console when testing the save operation

// Override the FormData append method to log what's being added
const originalAppend = FormData.prototype.append;
FormData.prototype.append = function(name, value) {
  console.log(`FormData.append('${name}', '${value}')`);
  return originalAppend.call(this, name, value);
};

// Override axios to log the request data
const originalPut = axios.put;
axios.put = function(url, data, config) {
  console.log('Axios PUT request:');
  console.log('URL:', url);
  console.log('Data:', data);
  console.log('Config:', config);
  
  if (data instanceof FormData) {
    console.log('FormData entries:');
    for (let [key, value] of data.entries()) {
      console.log(`  ${key}: ${value}`);
    }
  }
  
  return originalPut.call(this, url, data, config);
};

console.log('Debug script loaded. Now try saving the gallery.');