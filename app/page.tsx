import MainLayout from './(main)/layout';
import HomePage from '@/components/home/HomePage';

/**
 * Root route (/) - explicitly defined so Next.js always serves the home page.
 * Wraps the home content with the main app layout (nav, footer).
 */
export default function RootPage() {
  return (
    <MainLayout>
      <HomePage />
    </MainLayout>
  );
}
