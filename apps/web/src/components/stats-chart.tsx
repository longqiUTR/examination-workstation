"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function DailyChart({
  data,
}: {
  data: Array<{ date: string; total: number; correct: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line type="monotone" dataKey="total" name="做题数" stroke="#8884d8" />
        <Line type="monotone" dataKey="correct" name="答对数" stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ModuleChart({
  data,
}: {
  data: Array<{ module: string; accuracy: number; total: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="module" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => `${(Number(v) * 100).toFixed(1)}%`} />
        <Bar dataKey="accuracy" name="正确率" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
