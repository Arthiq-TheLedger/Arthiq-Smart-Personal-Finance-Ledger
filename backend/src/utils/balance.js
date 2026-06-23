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
  const targetId = upToId != null ? String(upToId) : null;
  for (const entry of entries) {
    const amount = parseFloat(entry.amount);
    balance += entry.entry_type === 'credit' ? amount : -amount;
    if (targetId != null && String(entry.id) === targetId) break;
  }
  return balance;
}

module.exports = { calculateRunningBalances, computeBalanceUpTo };
