export const TRIGGER_SLOTS = ['disciple_0', 'disciple_1', 'disciple_2'];
const COOLDOWNS = {
  async_moment: 8 * 60,
  async_epoch: 60,
  async_era: 24 * 60,
  async_legend: 7 * 24 * 60,
};
export const TRIGGER_TYPES = ['async_moment', 'async_epoch', 'async_era', 'async_legend'];
export const TRIGGER_STATUSES = ['idle', 'pending', 'confirmed', 'failed'];

export function createInitialAsyncState() {
  return {
    activeSlots: { disciple_0: null, disciple_1: null, disciple_2: null },
    availableSlots: [...TRIGGER_SLOTS],
    lockedSlots: [],
    history: [],
    qrState: { selectedId: null, dataUrl: null },
  };
}

export function readAsyncState() {
  try {
    const raw = localStorage.getItem('legacy-async-state-v1');
    if (!raw) return createInitialAsyncState();

    const parsed = JSON.parse(raw);
    return {
      activeSlots: {
        disciple_0: parsed.activeSlots?.disciple_0 || null,
        disciple_1: parsed.activeSlots?.disciple_1 || null,
        disciple_2: parsed.activeSlots?.disciple_2 || null,
      },
      availableSlots: Array.isArray(parsed.availableSlots)
        ? parsed.availableSlots.filter((item) => TRIGGER_SLOTS.includes(item))
        : [...TRIGGER_SLOTS],
      lockedSlots: Array.isArray(parsed.lockedSlots)
        ? parsed.lockedSlots.filter((item) => TRIGGER_SLOTS.includes(item))
        : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
      qrState: parsed.qrState || { selectedId: null, dataUrl: null },
    };
  } catch {
    return createInitialAsyncState();
  }
}

export function writeAsyncState(state) {
  localStorage.setItem('legacy-async-state-v1', JSON.stringify(state));
}

export function queueTrigger(state, input) {
  const nextAvailable = state.availableSlots[0];
  if (!nextAvailable) return state;

  const event = {
    id: crypto.randomUUID(),
    type: input.type,
    slot: nextAvailable,
    description: input.description || '',
    status: 'pending',
    submittedAt: Date.now(),
    context: input.context || {},
  };

  return {
    activeSlots: { ...state.activeSlots, [nextAvailable]: event },
    availableSlots: state.availableSlots.slice(1),
    lockedSlots: [...state.lockedSlots, nextAvailable],
    history: [event, ...state.history],
    qrState: state.qrState,
  };
}

export function advanceTrigger(state) {
  const lockIndex = 0;
  if (!state.lockedSlots[lockIndex]) return state;

  const finishedSlot = state.lockedSlots[lockIndex];
  const newAvailableSlots = [...state.availableSlots, finishedSlot];
  const newLockedSlots = state.lockedSlots.slice(1);
  const updatedHistory = state.history.map((item) => {
    if (item.slot !== finishedSlot || item.status !== 'pending') return item;
    return { ...item, status: 'confirmed', confirmedAt: Date.now() };
  });

  return {
    activeSlots: { ...state.activeSlots, [finishedSlot]: null },
    availableSlots: newAvailableSlots,
    lockedSlots: newLockedSlots,
    history: updatedHistory,
    qrState: state.qrState,
  };
}

export function failTrigger(state, slot) {
  if (!state.activeSlots[slot]) return state;

  const failed = {
    ...state.activeSlots[slot],
    status: 'failed',
    failedAt: Date.now(),
  };
  const newAvailableSlots = [...state.availableSlots, slot];
  const newLockedSlots = state.lockedSlots.filter((item) => item !== slot);
  const updatedHistory = state.history.map((item) =>
    item.slot === slot && item.status === 'pending' ? failed : item
  );

  return {
    activeSlots: { ...state.activeSlots, [slot]: null },
    availableSlots: newAvailableSlots,
    lockedSlots: newLockedSlots,
    history: updatedHistory,
    qrState: state.qrState,
  };
}

export function syncQrState(state, payload) {
  if (!payload) return state;
  return {
    ...state,
    qrState: {
      selectedId: payload.id || state.qrState.selectedId,
      dataUrl: payload.dataUrl,
    },
  };
}

export function generateQrDataUrl(text) {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
}
