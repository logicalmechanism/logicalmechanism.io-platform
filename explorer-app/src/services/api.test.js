// Example of an integration test without mocking fetch
import fetchTestData from './api';

test('fetchData successfully retrieves data', async () => {
  // Replace 'actualQueryParam' with a real query parameter value
  const actualQueryParam = 'The Ancient Kraken';
  const data = await fetchTestData(actualQueryParam);
  // Assert based on the expected structure and content of the real response
  expect(data).toBeDefined();
  expect(data).toEqual('Hello The Ancient Kraken!');
});
