
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Check, X } from 'lucide-react';

interface LogClimbFormProps {
    userId: string;
    onSuccess: () => void;
}

const TAG_OPTIONS = [
    'Arete/Corner', 'Balance', 'Coordination', 'Crimp', 'Dyno',
    'Gaston', 'Jam', 'Jug', 'Kneebar',
    'Lunge', 'Overhang', 'Pinch', 'Pocket', 'Slab', 'Sloper'
];

const GRADE_OPTIONS = Array.from({ length: 18 }, (_, i) => `V${i}`); // V0-V17

export default function LogClimbForm({ userId, onSuccess }: LogClimbFormProps) {
    // State
    // Fix: Use local date string (YYYY-MM-DD) instead of ISO (UTC) to prevent "yesterday" bug
    const [date, setDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [grade, setGrade] = useState('V0');
    const [isCustomGrade, setIsCustomGrade] = useState(false);
    const [attempts, setAttempts] = useState(1);
    const [isSent, setIsSent] = useState(true);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Handlers
    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('climbs').insert({
            user_id: userId,
            date,
            grade,
            grade_system: isCustomGrade ? 'Custom' : 'V-scale',
            attempts,
            is_sent: isSent,
            tags: selectedTags,
            notes,
        });

        setLoading(false);
        if (error) {
            alert('Error: ' + error.message);
        } else {
            onSuccess();
            // Reset relevant fields
            setAttempts(1);
            setNotes('');
            // Keep date same for logging multiple in session
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>

            {/* Date & Grade Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                <div>
                    <label className="label">Date</label>
                    <input
                        type="date"
                        className="input"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="label">Grade</label>
                    {!isCustomGrade ? (
                        <select
                            className="input"
                            value={grade}
                            onChange={(e) => {
                                if (e.target.value === 'Custom') setIsCustomGrade(true);
                                else setGrade(e.target.value);
                            }}
                        >
                            {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                            <option value="Custom">Custom...</option>
                        </select>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                className="input"
                                value={grade}
                                onChange={e => setGrade(e.target.value)}
                                placeholder="e.g. Red"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => { setIsCustomGrade(false); setGrade('V0'); }}
                                className="btn btn-secondary"
                                style={{ padding: '0.5rem' }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Attempts & Sent Status - Responsive Wrap */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 120px' }}>
                    <label className="label">Attempts</label>
                    <input
                        type="number"
                        min="1"
                        className="input"
                        value={attempts}
                        onChange={e => setAttempts(parseInt(e.target.value))}
                    />
                </div>
                <div style={{ flex: '1 1 auto', paddingBottom: '0.5rem' }}>
                    <label
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        <div style={{
                            width: '24px', height: '24px',
                            minWidth: '24px',
                            borderRadius: '6px',
                            border: '2px solid var(--border)',
                            background: isSent ? 'var(--success)' : 'white',
                            borderColor: isSent ? 'var(--success)' : 'var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white',
                            transition: 'all 0.2s'
                        }}>
                            {isSent && <Check size={16} strokeWidth={3} />}
                        </div>
                        <span style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>Did you send?</span>
                        <input
                            type="checkbox"
                            checked={isSent}
                            onChange={e => setIsSent(e.target.checked)}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            </div>

            {/* Style (formerly Tags) */}
            <div>
                <label className="label">Style</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {TAG_OPTIONS.map(tag => {
                        const isActive = selectedTags.includes(tag);
                        return (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    border: '1px solid',
                                    borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                                    background: isActive ? 'var(--primary-light)' : 'white',
                                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {tag}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Notes */}
            <div>
                <label className="label">Notes</label>
                <textarea
                    className="input"
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Write a note about your climb!"
                    maxLength={500}
                />
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {notes.length}/500
                </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Logging...' : 'Log Climb'}
            </button>

            <style jsx>{`
        .label {
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--text-muted);
        }
      `}</style>
        </form>
    );
}
