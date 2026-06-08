import { useState, useEffect } from 'react';
import { Send, Plus, Mail, User as UserIcon } from 'lucide-react';
import { getMyThreads, getThreadMessages, sendDirectMessage, getPublishedNewsletters, createOrGetDirectThread, getBlockedUsers } from '../lib/socialApi';
import { NewsletterCard } from './NewsletterCard';

export function MessagesTab({ session, localMode }) {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUserId, setOtherUserId] = useState('');
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const currentUserId = session?.user?.id;

  useEffect(() => {
    if (currentUserId) {
      loadThreads();
      loadNewsletters();
    }
  }, [currentUserId]);

  const loadThreads = async () => {
    const { data, error } = await getMyThreads(currentUserId);
    if (error) {
      setStatus('Failed to load threads: ' + error.message);
    } else {
      setThreads(data || []);
    }
  };

  const loadNewsletters = async () => {
    const { data, error } = await getPublishedNewsletters();
    if (error) {
      setStatus('Failed to load newsletters: ' + error.message);
    } else {
      setNewsletters(data || []);
    }
  };

  const openThread = async (thread) => {
    setSelectedThread(thread);
    setLoading(true);
    const { data, error } = await getThreadMessages(thread.id, currentUserId);
    if (error) {
      setStatus('Failed to load messages: ' + error.message);
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const handleStartDm = async (e) => {
    e.preventDefault();
    const targetId = otherUserId.trim();
    if (!targetId || targetId === currentUserId) {
      setStatus('Invalid user ID. Cannot message yourself.');
      return;
    }

    setLoading(true);
    setStatus('');
    const { data, error } = await createOrGetDirectThread(currentUserId, targetId);
    setLoading(false);

    if (error) {
      setStatus('Failed to start conversation: ' + error.message);
    } else {
      setOtherUserId('');
      setSelectedThread(data);
      setMessages([]);
      loadThreads();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    const { data, error } = await sendDirectMessage(selectedThread.id, currentUserId, newMessage.trim());
    if (error) {
      setStatus('Failed to send message: ' + error.message);
      return;
    }
    if (data) {
      setMessages([...messages, data]);
      setNewMessage('');
    }
    openThread(selectedThread);
  };

  if (localMode || !session) {
    return (
      <div className="screen-stack">
        <div className="boss-card">
          <p className="eyebrow">Messages</p>
          <h2>Messages</h2>
          <p>Sign in to message other operators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-stack">
      <div className="boss-card">
        <p className="eyebrow">Messages</p>
        <h2>Direct Messages</h2>
        <p>Message other operators safely.</p>
      </div>

      {newsletters.length > 0 && (
        <div className="quest-list">
          <h3>Developer Newsletters</h3>
          {newsletters.map(n => (
            <NewsletterCard key={n.id} newsletter={n} />
          ))}
        </div>
      )}

      <form className="form-card" onSubmit={handleStartDm}>
        <h3>Start a Conversation</h3>
        <div className="form-grid">
          <input
            value={otherUserId}
            onChange={e => setOtherUserId(e.target.value)}
            placeholder="User ID to message..."
          />
          <button type="submit" className="primary" disabled={!otherUserId.trim()}>
            <Send size={16} />
          </button>
        </div>
      </form>

      {status && (
        <div className="auth-error">
          {status}
        </div>
      )}

      <div className="quest-list">
        <h3>Message Threads</h3>
        {threads.length === 0 && (
          <div className="empty-state">
            <p>No messages yet.</p>
            <strong>Start a conversation with another operator.</strong>
          </div>
        )}

        {threads.map(thread => (
          <button
            key={thread.id}
            className="quest-item"
            onClick={() => openThread(thread)}
          >
            <div className="quest-left">
              <div className="quest-icon">
                <Mail size={20} />
              </div>
              <span>Thread</span>
            </div>
          </button>
        ))}
      </div>

      {selectedThread && (
        <div className="boss-card">
          <h3>Conversation</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="message-list">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message-bubble ${msg.sender_id === currentUserId ? 'outgoing' : 'incoming'}`}
                >
                  <p>{msg.body}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="form-grid">
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit" className="primary" disabled={!newMessage.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}