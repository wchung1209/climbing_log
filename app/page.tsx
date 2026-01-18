
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bouldering Log | Track Your Progression',
  description: 'A minimal, premium tool to track your indoor climbing sessions.',
};

export default function Home() {
  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem',
      background: '#ffffff'
    }}>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Image src="/logo.png" alt="Climbing Log" width={500} height={150} style={{ objectFit: 'contain' }} priority />
      </div>

      <p style={{
        fontSize: '1.25rem',
        color: 'var(--text-muted)',
        maxWidth: '600px',
        marginBottom: '3rem',
        lineHeight: '1.6'
      }}>
        The minimal logger for the modern climber.
      </p>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/login" className="btn btn-primary">
          Get Started
        </Link>
        <Link href="/login?mode=signup" className="btn btn-secondary">
          Sign Up
        </Link>
      </div>

      <div style={{
        marginTop: '6rem',
        padding: '2rem',
        borderRadius: 'var(--radius)',
        background: 'white',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        maxWidth: '800px',
        width: '100%'
      }}>
        {/* Mockup or Feature Grid could go here */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'left' }}>
          <div>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Log Sessions</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Quickly input your climbs, grades, and attempts.</p>
          </div>
          <div>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Track Stats</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>See your send percentage and highest grades.</p>
          </div>
          <div>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Any Grade</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Support for V-Scale, Font, or custom gym colors.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
