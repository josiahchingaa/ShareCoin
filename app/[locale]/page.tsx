import { getTranslations } from 'next-intl/server';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const t = await getTranslations('home');

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-6xl font-bold text-gradient-gold">
          {t('title')}
        </h1>
        <p className="text-2xl text-text-secondary">
          {t('subtitle')}
        </p>
        <p className="text-lg text-text-secondary max-w-md">
          {t('description')}
        </p>
        <div className="pt-8">
          <div className="inline-block px-6 py-3 bg-accent-green/20 rounded-lg border border-accent-green">
            <p className="text-accent-green font-medium">
              ✓ {t('initialized')}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
