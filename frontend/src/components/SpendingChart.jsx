import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export default function SpendingChart({ categories }) {
  if (!categories || categories.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">No spending data yet</p>;
  }

  const data = categories.map(c => ({
    name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
    value: Math.round(c.total * 100) / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
