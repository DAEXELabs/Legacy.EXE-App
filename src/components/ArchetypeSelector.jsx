import React, { useState } from 'react';

const archetypes = [
  {
    id: 'warrior',
    name: 'Warrior',
    title: 'Primal Fury',
    description: 'Master health, combat, and endurance. Turn daily movement into power.',
    color: '#3b82f6',
    icon: '⚔️',
  },
  {
    id: 'builder',
    name: 'Builder',
    title: 'Legacy Forge',
    description: 'Construct productivity systems and empire foundations.',
    color: '#10b981',
    icon: '🔨',
  },
  {
    id: 'scholar',
    name: 'Scholar',
    title: 'Arcane Compiler',
    description: 'Unravel knowledge, debug reality, and master arcane tech.',
    color: '#8b5cf6',
    icon: '📜',
  },
];

const ArchetypeSelector = ({ onSelect }) => {
  const [selected, setSelected] = useState(null);

  const handleSelect = (archetype) => {
    setSelected(archetype.id);
    if (onSelect) onSelect(archetype);
  };

  return (
    <div className="form-card archetype-selector">
      <h2 className="neon-glow" style={{ textAlign: 'center', marginBottom: '8px' }}>
        Choose Your Path
      </h2>
      <p style={{ textAlign: 'center', color: '#b9c1d9', marginBottom: '24px' }}>
        Your archetype defines how you compile your legacy.
      </p>

      <div style={{ display: 'grid', gap: '12px' }}>
        {archetypes.map((arch) => (
          <div
            key={arch.id}
            onClick={() => handleSelect(arch)}
            className={`archetype-option ${selected === arch.id ? 'selected' : ''}`}
            style={{
              padding: '16px',
              borderRadius: '18px',
              border: selected === arch.id ? '2px solid #fff' : '1px solid rgba(255,255,255,.12)',
              cursor: 'pointer',
              background: selected === arch.id
                ? `linear-gradient(145deg, rgba(0,0,0,0.8), ${arch.color}15)`
                : 'rgba(0,0,0,.2)',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>{arch.icon}</span>
              <div>
                <h3 style={{ margin: 0, color: arch.color }}>{arch.name}</h3>
                <p style={{ margin: 0, color: '#b9c1d9', fontSize: '12px' }}>{arch.title}</p>
              </div>
            </div>
            <p style={{ margin: '8px 0 0 0', color: '#aeb8da', fontSize: '13px' }}>{arch.description}</p>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button className="primary">
            Confirm Archetype
          </button>
        </div>
      )}
    </div>
  );
};

export default ArchetypeSelector;