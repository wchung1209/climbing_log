
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import ClimbChart from '@/app/components/ClimbChart';
import LogClimbForm from '@/app/components/LogClimbForm';
import SparklineChart from '@/app/components/SparklineChart';
import { Trash2, Menu, X, User } from 'lucide-react';
import Image from 'next/image';

const GREETINGS = [
    "Keep it crushing!",
    "Gravity is a myth!",
    "Send it!",
    "Chalk up and go!",
    "Another day, another send.",
    "You got this!"
];

export default function MainPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState(GREETINGS[0]);

    // Data
    const [climbs, setClimbs] = useState<any[]>([]);

    // UI State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [editNameValue, setEditNameValue] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Filters
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [selectedGrades, setSelectedGrades] = useState<string[]>([]); // Multi-select support

    // Edit Mode (Notes Only - per V4 request to remove Edit button, but we might keep internal capability or remove entirely. 
    // Request: "Edit from the activity log can be removed." -> OK, removing.)

    // Stats
    const [stats, setStats] = useState({
        totalSessions: 0,
        sendRate: 0,
        latestActiveDate: 'N/A',
        trendData: [] as any[]
    });

    useEffect(() => {
        // Random greeting
        setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
            } else {
                setUser(user);
                const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
                setProfile(profile);
                setEditNameValue(profile?.display_name || '');
                fetchClimbs(user.id);
            }
            setLoading(false);
        };
        checkUser();
    }, [router]);

    const fetchClimbs = async (userId: string) => {
        // Ensuring specific order for consistent display
        const { data, error } = await supabase
            .from('climbs')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false }) // Date descending
            .order('created_at', { ascending: false }); // Then creation time descending

        if (data) {
            setClimbs(data);
            calculateStats(data);
        }
    };

    const calculateStats = (data: any[]) => {
        const uniqueDates = new Set(data.map(c => c.date));
        const totalSessions = uniqueDates.size;

        const calculateRate = (subset: any[]) => {
            if (subset.length === 0) return 0;
            const sends = subset.filter(c => c.is_sent).length;
            return Math.round((sends / subset.length) * 100);
        }

        const sendRate = calculateRate(data);
        const latestActiveDate = data.length > 0 ? new Date(data[0].date).toLocaleDateString() : 'N/A';

        // Trend Data
        const dateGroups: Record<string, any[]> = {};
        data.forEach(c => {
            if (!dateGroups[c.date]) dateGroups[c.date] = [];
            dateGroups[c.date].push(c);
        });

        const trendData = Object.keys(dateGroups).sort().map(date => ({
            date,
            rate: calculateRate(dateGroups[date])
        }));

        setStats({
            totalSessions,
            sendRate,
            latestActiveDate,
            trendData
        });
    };

    const deleteClimb = async (id: string) => {
        const { error } = await supabase.from('climbs').delete().eq('id', id);
        if (!error && user) {
            await fetchClimbs(user.id);
        } else if (error) {
            alert('Error deleting: ' + error.message);
        }
    };

    const updateName = async () => {
        if (!user) return;
        // Fix: Use upsert to create profile if it doesn't exist (fixing empty table issue)
        const { error } = await supabase.from('profiles').upsert({
            id: user.id,
            display_name: editNameValue
        });
        if (!error) {
            setProfile({ ...profile, display_name: editNameValue });
            alert('Name updated!');
        } else {
            alert('Error updating name: ' + error.message);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    // Filter Logic for Table
    const filteredClimbs = climbs.filter(c => {
        // Filter Tag
        if (filterTag && (!c.tags || !c.tags.includes(filterTag))) return false;

        // Filter Grades (Multi-select)
        if (selectedGrades.length > 0) {
            if (!selectedGrades.includes(c.grade)) return false;
        }
        return true;
    });

    const totalPages = Math.ceil(filteredClimbs.length / ITEMS_PER_PAGE);
    const paginatedClimbs = filteredClimbs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    if (loading) return <div className="p-8 text-center text-muted">Loading...</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>

            {/* Header */}
            <header className="header-flex">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Image src="/logo.png" alt="Logo" width={80} height={80} style={{ objectFit: 'contain' }} />
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.2 }}>
                            Welcome, {profile?.display_name || 'Climber'}
                        </h1>
                        <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>
                            {greeting}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsMenuOpen(true)}
                    style={{
                        padding: '0.5rem', borderRadius: '50%', background: 'var(--surface)',
                        color: 'var(--text-main)', border: '1px solid var(--border)'
                    }}
                >
                    <User size={24} />
                </button>
            </header>

            {/* Side Menu Drawer */}
            {isMenuOpen && (
                <>
                    <div
                        onClick={() => setIsMenuOpen(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }}
                    />
                    <div style={{
                        position: 'fixed', top: 0, right: 0, bottom: 0, width: '300px',
                        background: 'white', zIndex: 50, padding: '2rem',
                        boxShadow: '-4px 0 10px rgba(0,0,0,0.1)',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Account</h2>
                            <button onClick={() => setIsMenuOpen(false)}><X /></button>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label className="label" style={{ marginBottom: '0.5rem', display: 'block' }}>Display Name</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    className="input"
                                    value={editNameValue}
                                    onChange={e => setEditNameValue(e.target.value)}
                                />
                                <button className="btn btn-primary" onClick={updateName} style={{ padding: '0.5rem' }}>Save</button>
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto' }}>
                            <button onClick={handleSignOut} className="btn btn-secondary" style={{ width: '100%', color: 'var(--error)', borderColor: 'var(--error)' }}>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard label="Total Sessions" value={stats.totalSessions} />
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Send Rate Trend</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                        <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)', lineHeight: 1 }}>{stats.sendRate}%</p>
                        <div style={{ paddingBottom: '5px' }}>
                            <SparklineChart data={stats.trendData} dataKey="rate" color="var(--success)" />
                        </div>
                    </div>
                </div>
                {/* Fix: Display date naively to avoid timezone shifts. Use climbs[0] (newest) instead of trendData[0] (oldest). */}
                <StatCard label="Last Session" value={climbs.length > 0 ? (() => {
                    // climbs is ordered by date desc, so climbs[0] is latest
                    const [y, m, d] = climbs[0].date.split('-');
                    return `${Number(m)}/${Number(d)}/${y}`;
                })() : 'N/A'} color="var(--primary)" />
            </div>

            <div className="dashboard-grid">

                {/* Left Column: Analytics & Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>

                    {/* Analytics Chart */}
                    <section className="card">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Analytics</h2>
                        <ClimbChart
                            data={climbs}
                            activeTag={filterTag}
                            selectedGrades={selectedGrades}
                            onFilterChange={(t, grades) => { setFilterTag(t); setSelectedGrades(grades); }}
                        />
                    </section>

                    {/* Recent Activity Feed */}
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.25rem' }}>Activity Log</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {paginatedClimbs.length === 0 ? (
                                <p className="text-muted">No climbs found.</p>
                            ) : (
                                paginatedClimbs.map(climb => {
                                    let gradeColor = '#e2e8f0';
                                    const g = climb.grade;
                                    if (['V0', 'V1'].includes(g)) gradeColor = '#facc15';
                                    else if (['V2', 'V3', 'V4'].includes(g)) gradeColor = '#4ade80';
                                    else if (['V5', 'V6', 'V7'].includes(g)) gradeColor = '#60a5fa';
                                    else if (['V8', 'V9', 'V10'].includes(g)) gradeColor = '#f87171';
                                    else if (g === 'V11+') gradeColor = '#c084fc';

                                    // Fix: Parse YYYY-MM-DD manually for display to ensure it matches input
                                    const [year, month, day] = climb.date.split('-');
                                    const dateDisplay = `${Number(month)}/${Number(day)}/${year}`;

                                    return (
                                        <div key={climb.id} className="card" style={{ display: 'flex', gap: '1rem' }}>
                                            {/* Grade Badge */}
                                            <div style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                minWidth: '60px', height: '60px',
                                                borderRadius: '12px',
                                                background: gradeColor,
                                                color: '#fff',
                                                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                                fontWeight: '800'
                                            }}>
                                                <span style={{ fontSize: '1.25rem' }}>{climb.grade}</span>
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                                            {climb.attempts} attempt{climb.attempts > 1 ? 's' : ''}
                                                            {climb.is_sent && <span style={{ color: 'var(--success)', marginLeft: '0.5rem' }}>✓ Sent</span>}
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                            {dateDisplay}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            onClick={() => deleteClimb(climb.id)}
                                                            style={{ color: 'var(--text-muted)', padding: '4px', opacity: 0.6 }}
                                                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {climb.tags && climb.tags.length > 0 && (
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                                                        {climb.tags.map((t: string) => (
                                                            <span key={t} style={{
                                                                fontSize: '0.75rem', padding: '0.2rem 0.6rem',
                                                                borderRadius: '10px', background: 'var(--surface)', color: 'var(--text-muted)'
                                                            }}>
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {climb.notes && (
                                                    <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                                        "{climb.notes}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Pagination Controls - Modern Minimalist */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '1.5rem', alignItems: 'center' }}>
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    style={{
                                        fontWeight: '600', color: page === 1 ? 'var(--text-muted)' : 'var(--primary)',
                                        opacity: page === 1 ? 0.3 : 1
                                    }}
                                >
                                    Previous
                                </button>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    {page} / {totalPages}
                                </span>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    style={{
                                        fontWeight: '600', color: page === totalPages ? 'var(--text-muted)' : 'var(--primary)',
                                        opacity: page === totalPages ? 0.3 : 1
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column: Logging Form */}
                <div>
                    <div className="card">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Log Session</h2>
                        <LogClimbForm userId={user?.id} onSuccess={() => fetchClimbs(user.id)} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string, value: string | number, color?: string }) {
    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</h3>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: color || 'var(--text-main)', lineHeight: 1 }}>{value}</p>
        </div>
    )
}
