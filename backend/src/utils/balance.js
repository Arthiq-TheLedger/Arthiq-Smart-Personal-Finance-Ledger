function calculateRunningBalances(entries) {
  let balance = 0;
  return entries.map((entry) => {
    const amount = parseFloat(entry.amount);
    if (entry.entry_type === 'credit') {
      balance += amount;
    } else {
      balance -= amount;
    }
    return {
      ...entry,
      running_balance: balance,
      display_balance: entry.show_balance ? entry.balance_snapshot ?? balance : null,
      ghost_balance: balance,
    };
  });
}

function computeBalanceUpTo(entries, upToId) {
  let balance = 0;
  for (const entry of entries) {
    const amount = parseFloat(entry.amount);
    balance += entry.entry_type === 'credit' ? amount : -amount;
    if (entry.id === upToId) break;
  }
  return balance;
}

module.exports = { calculateRunningBalances, computeBalanceUpTo };
