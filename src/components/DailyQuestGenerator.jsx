import { useState } from 'react';
import { Plus } from 'lucide-react';

const difficultyXp = {
  easy: 25,
  normal: 50,
  hard: 75,
  major: 100,
};

const archetypeQuestTemplates = {
  warrior: [
    { title: 'Morning workout', stat: 'health', difficulty: 'normal', frequency: 'daily', proof: 'workout' },
    { title: 'Combat discipline drill', stat: 'discipline', difficulty: 'hard', frequency: 'daily', proof: 'honor' },
    { title: 'Endurance training', stat: 'health', difficulty: 'hard', frequency: 'daily', proof: 'timer' },
    { title: 'Physical recovery session', stat: 'health', difficulty: 'easy', frequency: 'daily', proof: 'honor' },
    { title: 'Fight against the drift', stat: 'discipline', difficulty: 'normal', frequency: 'daily', proof: 'checkin' },
  ],
  builder: [
    { title: 'Deep work session', stat: 'discipline', difficulty: 'normal', frequency: 'daily', proof: 'timer' },
    { title: 'System optimization task', stat: 'wealth', difficulty: 'normal', frequency: 'daily', proof: 'honor' },
    { title: 'Productivity review', stat: 'discipline', difficulty: 'easy', frequency: 'daily', proof: 'honor' },
    { title: 'Empire foundations plan', stat: 'wealth', difficulty: 'hard', frequency: 'daily', proof: 'timer' },
    { title: 'Legacy structure build', stat: 'discipline', difficulty: 'major', frequency: 'daily', proof: 'honor' },
  ],
  scholar: [
    { title: 'Knowledge study session', stat: 'knowledge', difficulty: 'normal', frequency: 'daily', proof: 'honor' },
    { title: 'Read research papers', stat: 'knowledge', difficulty: 'easy', frequency: 'daily', proof: 'honor' },
    { title: 'Write learning summary', stat: 'creativity', difficulty: 'hard', frequency: 'daily', proof: 'checkin' },
    { title: 'Arcane debugging', stat: 'knowledge', difficulty: 'normal', frequency: 'daily', proof: 'timer' },
    { title: 'Wisdom ascension read', stat: 'knowledge', difficulty: 'hard', frequency: 'daily', proof: 'checkin' },
  ],
};

export default function DailyQuestGenerator({ archetype, onQuestGenerated, existingQuests = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    const templates = archetypeQuestTemplates[archetype] || archetypeQuestTemplates.scholar;
    const usedTemplates = (existingQuests || []).map(q => q.title);
    const availableTemplates = templates.filter(t => !usedTemplates.includes(t.title));

    const pool = availableTemplates.length > 0 ? availableTemplates : templates;
    const randomTemplate = pool[Math.floor(Math.random() * pool.length)];
    const difficulty = randomTemplate.difficulty || 'normal';

    if (onQuestGenerated) {
      onQuestGenerated({
        ...randomTemplate,
        difficulty,
        frequency: randomTemplate.frequency || 'daily',
        xp: difficultyXp[difficulty] || 50,
        id: crypto.randomUUID(),
        completedToday: false,
      });
    }

    setTimeout(() => setIsGenerating(false), 800);
  };

  return (
    <button
      className="primary"
      onClick={handleGenerate}
      disabled={isGenerating}
      style={{ width: '100%' }}
    >
      <Plus size={18} />
      {isGenerating ? 'Generating...' : `Generate ${archetype ? archetype.charAt(0).toUpperCase() + archetype.slice(1) : ''} Quest`}
    </button>
  );
}