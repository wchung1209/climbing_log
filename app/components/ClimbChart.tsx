
'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { format } from 'date-fns';

interface ClimbChartProps {
    data: any[];
    activeTag: string | null;
    activeGradeGroup: string | null;
    onFilterChange: (tag: string | null, gradeGroup: string | null) => void;
}

const TAG_OPTIONS = [
    'Arete/Corner', 'Balance', 'Coordination', 'Crimp', 'Dyno',
    'Gaston', 'Jam', 'Jug', 'Kneebar',
    'Lunge', 'Overhang', 'Pinch', 'Pocket', 'Slab', 'Sloper'
];

const GRADE_GROUPS = [
    { label: 'Yellow (V0-V1)', color: '#facc15', id: 'Yellow' },
    { label: 'Green (V2-V4)', color: '#4ade80', id: 'Green' },
    { label: 'Blue (V5-V7)', color: '#60a5fa', id: 'Blue' },
    { label: 'Red (V8-V10)', color: '#f87171', id: 'Red' },
    { label: 'Purple (V11+)', color: '#c084fc', id: 'Purple' },
];

export default function ClimbChart({ data, activeTag, selectedGrades, onFilterChange }: {
    data: any[],
    activeTag: string | null,
    selectedGrades: string[],
    onFilterChange: (tag: string | null, grades: string[]) => void
}) {

    const GRADE_OPTIONS = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11+'];

    // Helper to parse "YYYY-MM-DD" as local date (prevents UTC shift)
    const parseLocalDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const processData = () => {
        // 1. Filter by Grade Group
        let filtered = data;

        if (selectedGrades.length > 0) {
            filtered = filtered.filter(c => selectedGrades.includes(c.grade));
        }

        // 2. Filter by Tag
        if (activeTag) {
            filtered = filtered.filter(c => c.tags?.includes(activeTag));
        }

        const uniqueDates = Array.from(new Set(filtered.map(d => d.date))).sort();

        return uniqueDates.map(date => {
            const dayClimbs = filtered.filter(d => d.date === date);
            const sends = dayClimbs.filter(c => c.is_sent).length;
            const total = dayClimbs.length;
            const rate = total > 0 ? Math.round((sends / total) * 100) : 0;

            return {
                date, // Keep string for key
                rate,
                details: { sends, total }
            };
        });
    };

    const chartData = processData();

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const { rate, details } = payload[0].payload;
            return (
                <div className="card" style={{ padding: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{format(parseLocalDate(label), 'MMM d, yyyy')}</p>
                    <p style={{ color: 'var(--success)', fontWeight: '600' }}>
                        {rate}% Send Rate
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        ({details.sends} out of {details.total} climbs)
                    </p>
                </div>
            );
        }
        return null;
    };

    const toggleGrade = (grade: string) => {
        if (selectedGrades.includes(grade)) {
            onFilterChange(activeTag, selectedGrades.filter(g => g !== grade));
        } else {
            onFilterChange(activeTag, [...selectedGrades, grade]);
        }
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Filters */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Grade Filters */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.5rem' }}>Grades:</span>
                    <button
                        onClick={() => onFilterChange(activeTag, [])}
                        style={{
                            padding: '0.3rem 0.8rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            border: '1px solid',
                            borderColor: selectedGrades.length === 0 ? 'var(--text-main)' : 'var(--border)',
                            background: selectedGrades.length === 0 ? 'var(--text-main)' : 'white',
                            color: selectedGrades.length === 0 ? 'white' : 'var(--text-muted)',
                        }}
                    >All</button>
                    {GRADE_OPTIONS.map(grade => {
                        const isSelected = selectedGrades.includes(grade);
                        return (
                            <button
                                key={grade}
                                onClick={() => toggleGrade(grade)}
                                style={{
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    border: '1px solid',
                                    borderColor: isSelected ? 'var(--text-main)' : 'var(--border)',
                                    background: isSelected ? 'var(--text-main)' : 'white',
                                    color: isSelected ? 'white' : 'var(--text-muted)',
                                    minWidth: '35px'
                                }}
                            >
                                {grade}
                            </button>
                        )
                    })}
                </div>

                {/* Tag Filters */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.5rem' }}>Style:</span>
                    {TAG_OPTIONS.map(tag => {
                        const isActive = activeTag === tag;
                        return (
                            <button
                                key={tag}
                                onClick={() => onFilterChange(isActive ? null : tag, selectedGrades)}
                                style={{
                                    padding: '0.3rem 0.8rem',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: '500',
                                    border: '1px solid',
                                    borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                                    background: isActive ? 'var(--primary-light)' : 'white',
                                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {tag}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{ width: '100%', height: 300 }}>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(str) => format(parseLocalDate(str), 'MMM d')}
                                stroke="#94a3b8"
                                fontSize={12}
                                tickMargin={10}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                unit="%"
                                stroke="#94a3b8"
                                fontSize={12}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 2 }} />
                            <Line
                                type="monotone"
                                dataKey="rate"
                                stroke="var(--primary)"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
                                activeDot={{ r: 6, stroke: 'white' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                        No active session data for this filter.
                    </div>
                )}
            </div>
        </div>
    );
}
