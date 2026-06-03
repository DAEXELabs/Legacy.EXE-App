export function calculateEffortScore(log) {
  const duration = Number(log.duration || 0);
  const effort = Number(log.effort || 0);
  const sets = Number(log.sets || 0);
  const reps = Number(log.reps || 0);

  return Math.round(
    duration +
    effort * 5 +
    sets * 2 +
    Math.floor(reps / 10)
  );
}

export function getWorkoutTier(level) {
  if (level <= 5) {
    return {
      name: 'Initiate',
      intensity: 'Foundation',
      target: 'Learn form and finish clean.',
      exercises: [
        { name: 'Pushups', sets: 2, reps: 8, weight: 'Bodyweight' },
        { name: 'Bodyweight Squats', sets: 2, reps: 10, weight: 'Bodyweight' },
        { name: 'Plank', sets: 2, reps: '20 sec', weight: 'Bodyweight' },
      ],
    };
  }

  if (level <= 15) {
    return {
      name: 'Builder',
      intensity: 'Structured',
      target: 'More volume, more consistency.',
      exercises: [
        { name: 'Pushups', sets: 3, reps: 12, weight: 'Bodyweight' },
        { name: 'Squats', sets: 3, reps: 15, weight: 'Bodyweight or light dumbbell' },
        { name: 'Dumbbell Rows', sets: 3, reps: 10, weight: 'Moderate' },
        { name: 'Plank', sets: 3, reps: '30 sec', weight: 'Bodyweight' },
      ],
    };
  }

  if (level <= 30) {
    return {
      name: 'Warrior',
      intensity: 'Weighted',
      target: 'Push strength and conditioning.',
      exercises: [
        { name: 'Goblet Squat', sets: 4, reps: 10, weight: 'Moderate-heavy' },
        { name: 'Pushups or Bench Press', sets: 4, reps: 12, weight: 'Moderate' },
        { name: 'Dumbbell Rows', sets: 4, reps: 12, weight: 'Moderate-heavy' },
        { name: 'Lunges', sets: 3, reps: '12 each leg', weight: 'Moderate' },
        { name: 'Plank', sets: 3, reps: '45 sec', weight: 'Bodyweight' },
      ],
    };
  }

  if (level <= 50) {
    return {
      name: 'Ascendant',
      intensity: 'High Output',
      target: 'Volume, supersets, and a finisher.',
      exercises: [
        { name: 'Squat or Leg Press', sets: 4, reps: 10, weight: 'Heavy' },
        { name: 'Press Movement', sets: 4, reps: 10, weight: 'Heavy' },
        { name: 'Row Movement', sets: 4, reps: 12, weight: 'Heavy' },
        { name: 'Romanian Deadlift', sets: 4, reps: 10, weight: 'Moderate-heavy' },
        { name: 'Core Circuit', sets: 4, reps: '45 sec', weight: 'Bodyweight' },
        { name: 'Finisher', sets: 1, reps: '5 min AMRAP', weight: 'Conditioning' },
      ],
    };
  }

  return {
    name: 'Legacy',
    intensity: 'Elite',
    target: 'Advanced volume. No empty reps.',
    exercises: [
      { name: 'Compound Lower Body', sets: 5, reps: 8, weight: 'Heavy' },
      { name: 'Compound Upper Push', sets: 5, reps: 8, weight: 'Heavy' },
      { name: 'Compound Pull', sets: 5, reps: 10, weight: 'Heavy' },
      { name: 'Accessory Superset', sets: 4, reps: 12, weight: 'Moderate-heavy' },
      { name: 'Core Finisher', sets: 4, reps: '60 sec', weight: 'Bodyweight' },
      { name: 'Conditioning Finisher', sets: 1, reps: '8 min AMRAP', weight: 'Conditioning' },
    ],
  };
}

export function getRegimenTotals(regimen) {
  return regimen.exercises.reduce(
    (total, exercise) => ({
      sets: total.sets + Number(exercise.sets || 0),
      exercises: total.exercises + 1,
    }),
    { sets: 0, exercises: 0 }
  );
}
