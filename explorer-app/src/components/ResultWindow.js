import React from 'react';

const ResultWindow = ({ result }) => {
  return (
    <div>
      {result ? (
        <div>
          {/* Display your search results here. For now, we just show the search input. */}
          Search Result: {result}
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default ResultWindow;
