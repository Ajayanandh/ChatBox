import type { Metadata } from 'next';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChatBox - Personal AI Assistant',
  description: 'Production-ready ChatGPT-like personal assistant with Gemini, OpenAI, RAG, and memory.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased overflow-hidden">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
