import {
  Brain,
  CheckCircle2,
  MessageSquareText,
  Plus,
  Sparkles,
} from 'lucide-react';

export function ReadingTab({
  readingGoal,
  readingDraft,
  setReadingDraft,
  logReadingProgress,
  booksProgress,
  chaptersProgress,
  readingXpEarned,
}) {
  return (
    <section className="screen-stack">
      <div className="boss-card">
        <p className="eyebrow">Reading Campaign</p>
        <h2>Build the Knowledge stat.</h2>
        <p>
          Track books, chapters, and pages. Reading progress earns XP and strengthens your Knowledge path.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Brain size={20} />
          <span>Books Completed</span>
          <strong>
            {readingGoal.booksCompleted}/{readingGoal.monthlyBooksTarget}
          </strong>
        </div>

        <div className="stat-card">
          <MessageSquareText size={20} />
          <span>Chapters Completed</span>
          <strong>
            {readingGoal.chaptersCompleted}/{readingGoal.monthlyChaptersTarget}
          </strong>
        </div>

        <div className="stat-card">
          <Sparkles size={20} />
          <span>Reading XP</span>
          <strong>{readingXpEarned}</strong>
        </div>

        <div className="stat-card">
          <Brain size={20} />
          <span>Pages Read</span>
          <strong>{readingGoal.pagesRead}</strong>
        </div>
      </div>

      <div className="xp-card">
        <div className="row-between">
          <span>Monthly Book Goal</span>
          <strong>{booksProgress}%</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${booksProgress}%` }} />
        </div>
      </div>

      <div className="xp-card">
        <div className="row-between">
          <span>Monthly Chapter Goal</span>
          <strong>{chaptersProgress}%</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill boss" style={{ width: `${chaptersProgress}%` }} />
        </div>
      </div>

      <form className="form-card" onSubmit={logReadingProgress}>
        <h3>Log Reading Progress</h3>

        <input
          value={readingDraft.currentBook}
          onChange={e =>
            setReadingDraft({ ...readingDraft, currentBook: e.target.value })
          }
          placeholder="Current book"
        />

        <div className="form-grid">
          <input
            type="number"
            min="0"
            value={readingDraft.chapters}
            onChange={e =>
              setReadingDraft({ ...readingDraft, chapters: e.target.value })
            }
            placeholder="Chapters read"
          />

          <input
            type="number"
            min="0"
            value={readingDraft.pages}
            onChange={e =>
              setReadingDraft({ ...readingDraft, pages: e.target.value })
            }
            placeholder="Pages read"
          />
        </div>

        <label className="reward unlocked">
          <CheckCircle2 />
          <div>
            <strong>Completed the book?</strong>
            <p>Adds a 100 XP completion bonus.</p>
          </div>
          <input
            type="checkbox"
            checked={readingDraft.completedBook}
            onChange={e =>
              setReadingDraft({ ...readingDraft, completedBook: e.target.checked })
            }
          />
        </label>

        <button
          className="primary"
          disabled={
            !readingDraft.currentBook.trim() ||
            (
              Number(readingDraft.chapters || 0) <= 0 &&
              Number(readingDraft.pages || 0) <= 0 &&
              !readingDraft.completedBook
            )
          }
        >
          <Plus size={18} /> Log Reading XP
        </button>
      </form>

      <div className="quest-list">
        <div className="row-between">
          <h3>Reading Log</h3>
          <span className="proof-badge">
            {(readingGoal.readingLogs || []).length} Entries
          </span>
        </div>

        {(readingGoal.readingLogs || []).length === 0 && (
          <div className="empty-state">
            <p>No reading logged yet.</p>
            <strong>Your next chapter starts the campaign.</strong>
          </div>
        )}

        {(readingGoal.readingLogs || []).map(log => (
          <div className="reward unlocked" key={log.id}>
            <Brain />
            <div>
              <strong>{log.book}</strong>
              <p>
                {log.chapters} chapters • {log.pages} pages • {new Date(log.date).toLocaleDateString()}
              </p>
              {log.completedBook && <p>Book completed.</p>}
            </div>
            <span>+{log.xp} XP</span>
          </div>
        ))}
      </div>
    </section>
  );
}
