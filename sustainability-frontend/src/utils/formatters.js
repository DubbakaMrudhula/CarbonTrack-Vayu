// Date formatting: DD/MM/YYYY
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function todayISO() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function currentMonthLabel() {
  const now = new Date();
  return now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

// Number formatting using en-IN locale (Indian numbering system)
export function formatNumber(value, decimalPlaces = 4) {
  if (value === null || value === undefined) return '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(num);
}

// CO2e values always shown to 4 decimal places
export function formatCO2e(value) {
  return formatNumber(value, 4);
}

// Quantity values to 4 decimal places
export function formatQuantity(value) {
  return formatNumber(value, 4);
}

// Initials from user name
export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

