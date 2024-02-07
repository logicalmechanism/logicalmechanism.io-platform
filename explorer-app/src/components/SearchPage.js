import React, { useState } from 'react';
import SearchBar from './SearchBar';
import ResultWindow from './ResultWindow';

const SearchPage = () => {
  const [searchResult, setSearchResult] = useState(null);

  const handleSearch = (value) => {
    console.log(value);
    if (value.includes('addr')) {
        console.log("its an address");
    } else if (value.length === 64) {
        console.log("its a tx hash");
    } else {
        console.log("this needs to a be a warning color");
    }
    
    setSearchResult(value);
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <ResultWindow result={searchResult} />
    </div>
  );
};

export default SearchPage;
