import React from 'react';
import { Input } from 'antd';

const SearchBar = ({ onSearch }) => {
  return (
    <Input.Search
      id="searchInput"
      size="large"
      enterButton="Search"
      placeholder="address or transaction hash"
      allowClear
      maxLength={103}
      onSearch={onSearch} // Use onSearch for Input.Search to handle search execution
      style={{ width: '75vw' }}
    />
  );
};

export default SearchBar;
