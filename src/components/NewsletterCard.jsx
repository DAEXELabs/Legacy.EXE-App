import { formatDistanceToNow } from 'date-fns';

export function NewsletterCard({ newsletter }) {
  return (
    <article className="form-card newsletter-card">
      <h3>{newsletter.title}</h3>
      <p className="newsletter-author">{newsletter.author_label}</p>
      <p className="newsletter-body">{newsletter.body}</p>
      <small className="newsletter-date">
        {formatDistanceToNow(new Date(newsletter.created_at), { addSuffix: true })}
      </small>
    </article>
  );
}