import React, { useState } from 'react';

import { Warrior, Builder, Scholar } from '../data/archetypes'; // Adjust path as needed

// Simple archetype data (expand with your full designs)
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
    // Save to Supabase or local state here
    if (onSelect) onSelect(archetype);
  };

  return (
    <div className="archetype-selector p-6 max-w-4xl mx-auto">
      <h2 className="text-4xl font-bold text-center mb-8 text-white neon-glow">
        Choose Your Path, Uncompiled
      </h2>
      <p className="text-center text-gray-400 mb-12 max-w-md mx-auto">
        Your archetype shapes your journey through the Legacy Realms.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {archetypes.map((arch) => (
          <div
            key={arch.id}
            onClick={() => handleSelect(arch)}
            className={`archetype-card p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 
              ${selected === arch.id ? 'border-white shadow-2xl' : 'border-transparent'}
            `}
            style={{ backgroundColor: `${arch.color}20`, borderColor: selected === arch.id ? '#fff' : arch.color }}
          >
            <div className="text-6xl mb-6 text-center">{arch.icon}</div>
            <h3 className="text-2xl font-bold mb-2 text-white text-center" style={{ color: arch.color }}>
              {arch.name}
            </h3>
            <p className="text-sm text-gray-300 mb-4 text-center font-mono">{arch.title}</p>
            <p className="text-gray-400 text-center leading-relaxed">{arch.description}</p>
          </div>
        ))}
      </div>

      {selected && (
        <div className="mt-10 text-center">
          <button
            onClick={() => alert(`Selected: ${selected.toUpperCase()} — Welcome to the Legacy Realms!`)}
            className="px-10 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition"
          >
            Begin Your Legacy
          </button>
        </div>
      )}
    </div>
  );
};

export default ArchetypeSelector;
