import { useState } from 'react';
import { Plus } from 'lucide-react';

const archetypeQuestTemplates = {
  warrior: [
    { title: 'Morning workout', stat: 'health', difficulty: 'normal', proof: 'workout' },
    { title: 'Combat discipline drill', stat: 'discipline', difficulty: 'hard', proof: 'honor' },
    { title: 'Endurance training', stat: 'health', difficulty: 'hard', proof: 'timer' },
  ],
  builder: [
    { title: 'Deep work session', stat: 'discipline', difficulty: 'normal', proof: 'timer' },
    { title: 'System optimization task', stat: 'wealth', difficulty: 'normal', proof: 'honor' },
    { title: 'Productivity review', stat: 'discipline', difficulty: 'easy', proof: 'honor' },
  ],
  scholar: [
    { title: 'Knowledge study session', stat: 'knowledge', difficulty: 'normal', proof: 'honor' },
    { title: 'Read research papers', stat: 'knowledge', difficulty: 'easy', proof: 'honor' },
    { title: 'Write learning summary', stat: 'creativity', difficulty: 'hard', proof: 'checkin' },
  ],
};

export default function DailyQuestGenerator({ archetype, onQuestGenerated }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    const templates = archetypeQuestTemplates[archetype] || archetypeQuestTemplates.scholar;
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    if (onQuestGenerated) {
      onQuestGenerated({
        ...randomTemplate,
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
      {isGenerating ? 'Generating...' : 'Generate Daily Quest'}
    </button>
  );
}