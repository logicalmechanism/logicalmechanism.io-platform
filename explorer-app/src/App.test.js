import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the search input', () => {
  render(<App />);
  // Using getByPlaceholderText to find the input field
  const searchInput = screen.getByPlaceholderText(/address or transaction hash/i);
  expect(searchInput).toBeInTheDocument();
});
