
'use client';

import {
    LineChart,
    Line,
    ResponsiveContainer
} from 'recharts';

interface SparklineProps {
    data: any[];
    dataKey: string;
    color?: string;
}

export default function SparklineChart({ data, dataKey, color = '#3b82f6' }: SparklineProps) {
    if (!data || data.length < 2) return null;

    return (
        <div style={{ width: '100px', height: '40px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
