import React from 'react';

export default function DataTable({
  columns = [],
  data = [],
  emptyMessage = 'No activities logged yet.',
  className = ''
}) {
  if (!data || data.length === 0) {
    return (
      <div className={`data-table-container ${className}`}>
        <div className="empty-state">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={`data-table-container ${className}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={col.key || index} style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={col.key || colIndex}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

