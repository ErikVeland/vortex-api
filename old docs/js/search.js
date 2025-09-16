(function() {
  function displaySearchResults(term, results) {
    const searchTerm = document.getElementById('search_term');
    searchTerm.innerHTML = `"${term}"`;
    const searchResults = document.getElementById('search_results');

    if (results.length) {
      let appendString = '';

      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        appendString += '<li><a href="/vortex-api/' + item.ref + '"><h3>' + item.ref + '</h3></a>';
      }

      searchResults.innerHTML = appendString;
    } else {
      searchResults.innerHTML = '<li>No results found</li>';
    }
  }

  function getQueryVariable(variable) {
    const query = window.location.search.substring(1);
    const vars = query.split('&');

    for (let i = 0; i < vars.length; i++) {
      const pair = vars[i].split('=');

      if (pair[0] === variable) {
        return decodeURIComponent(pair[1].replace(/\+/g, '%20'));
      }
    }
  }

  const searchTerm = getQueryVariable('query');

  if (searchTerm) {
    document.getElementById('search-box').setAttribute("value", searchTerm);

    const idx = lunr.Index.load(window.search_index);

    const results = idx.search(searchTerm);
    displaySearchResults(searchTerm, results);
  }
})();
