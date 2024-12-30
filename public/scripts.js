document.addEventListener("DOMContentLoaded", () => {
  fetchVaultData();
  fetchAccounts();
  fetchTransactions();

  // Attach event listener to the search button
  const searchButton = document.getElementById('searchButton');
  if (searchButton) {
    searchButton.addEventListener('click', performSearch);
  } else {
    console.error('Search button not found in the DOM.');
  }
});

async function performSearch() {
  const query = document.getElementById('searchInput').value.trim();

  if (!query) {
    document.getElementById('searchResults').innerHTML = '<p>Please enter a valid search query.</p>';
    return;
  }

  try {
    const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const result = await response.json();
    let html = '';

    if (result.type === 'vault') {
      html += `
        <div class="result">
          <h3>Vault Found</h3>
          <table>
            <tr><th>Name</th><td>${result.data.name}</td></tr>
            <tr><th>Native Coin</th><td>${result.data.native}</td></tr>
            <tr><th>Total Supply</th><td>${result.data.totalSupply}</td></tr>
            <tr><th>Circulating Supply</th><td>${result.data.circulatingSupply}</td></tr>
          </table>
        </div>
      `;
    } else if (result.type === 'account') {
      html += `
        <div class="result">
          <h3>Account Found</h3>
          <table>
            <tr><th>Account ID</th><td>${result.data._id}</td></tr>
            <tr><th>Balance</th><td>${result.data.balance}</td></tr>
            <tr><th>Owner ID</th><td>${result.data.ownerId}</td></tr>
            <tr><th>Account Type</th><td>${result.data.accountType}</td></tr>
            <tr><th>Tokens Vested</th><td>${result.data.tokensVested}</td></tr>
            <tr><th>Total Allocated</th><td>${result.data.totalAllocated}</td></tr>
            <tr><th>Cliff End Date</th><td>${new Date(result.data.cliffEndDate).toLocaleDateString()}</td></tr>
            <tr><th>Vesting End Date</th><td>${new Date(result.data.vestingEndDate).toLocaleDateString()}</td></tr>
          </table>
        </div>
      `;
    } else {
      html = '<p>No results found.</p>';
    }

    document.getElementById('searchResults').innerHTML = html;
  } catch (error) {
    console.error('Error performing search:', error.message);
    document.getElementById('searchResults').innerHTML = '<p>Error performing search.</p>';
  }
}


function fetchTransactions() {
  fetch('/transactions')
    .then(response => response.json())
    .then(data => {
      const html = data.map(transaction => `
        <li>
          <strong>ID:</strong> ${transaction._id} |
          <strong>From:</strong> ${transaction.from ? `Account ID: ${transaction.from._id}, Balance: ${transaction.from.balance}` : 'N/A'} |
          <strong>To:</strong> ${transaction.to ? `Account ID: ${transaction.to._id}, Balance: ${transaction.to.balance}` : 'N/A'} |
          <strong>Amount:</strong> ${transaction.amount} |
          <strong>Date:</strong> ${transaction.timestamp ? new Date(transaction.timestamp).toLocaleString() : 'Invalid Date'}
        </li>
      `).join('');
      document.getElementById("transactionsData").innerHTML = `<ul>${html}</ul>`;
    })
    .catch(error => {
      console.error('Error fetching transactions:', error.message);
      document.getElementById("transactionsData").innerHTML = '<p>Error loading transactions.</p>';
    });
}


function fetchVaultData() {
  fetch('/vault')
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to fetch vault data");
      }
      return response.json();
    })
    .then(data => {
      const vaultDataHTML = `
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Native Coin:</strong> ${data.native}</p>
        <p><strong>Total Supply:</strong> ${data.totalSupply}</p>
        <p><strong>Circulating Supply:</strong> ${data.circulatingSupply}</p>
        <h3>Allocations</h3>
        <ul>
          ${Object.entries(data.allocations).map(([key, value]) => `
            <li><strong>${key}:</strong> ${value.amount} (Cliff: ${value.cliff} months, Vesting: ${value.vestingPeriod} months)</li>
          `).join("")}
        </ul>
      `;
      document.getElementById("vaultData").innerHTML = vaultDataHTML;
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById("vaultData").innerText = "Error loading vault data.";
    });
}

function fetchAccounts() {
  fetch('/accounts')
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to fetch accounts data");
      }
      return response.json();
    })
    .then(data => {
      const accountsHTML = data.map(account => `
        <li>
          <strong>ID:</strong> ${account._id} |
          <strong>Balance:</strong> ${account.balance} |
          <strong>Type:</strong> ${account.accountType}
        </li>
      `).join("");
      document.getElementById("accountsData").innerHTML = `<ul>${accountsHTML}</ul>`;
    })
    .catch(error => {
      document.getElementById("accountsData").innerText = "Error loading accounts.";
      console.error(error);
    });
}
