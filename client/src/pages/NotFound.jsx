import { useEffect } from 'react';
import { Button } from '../components/ui.jsx';

// Unknown address (the server also answers 404 in production)
export default function NotFound() {
  useEffect(() => {
    document.title = 'Page not found · Real Reel Drama';
  }, []);
  return (
    <section className="page-state page-state--404">
      <p className="caps">ERROR 404</p>
      <h1 className="display page-state__title">Plot twist!</h1>
      <p className="script page-state__note">This scene didn’t make the final cut.</p>
      <p className="lead">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="actions">
        <Button href="/">Back to home</Button>
        <Button href="/contact" kind="outline">
          Contact
        </Button>
      </div>
    </section>
  );
}
