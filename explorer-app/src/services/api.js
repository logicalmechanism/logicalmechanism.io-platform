// src/services/api.js

const fetchTestData = async (param) => {
    const queryString = encodeURIComponent(param);
    const url = `https://faas-sfo3-7872a1dd.doserverless.co/api/v1/web/fn-511ee93a-b115-4e06-a3be-3f2c1d348173/sample/hello?name=${queryString}`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error("Fetch error:", error.message);
      throw error;
    }
  };
  
  export default fetchTestData;
  