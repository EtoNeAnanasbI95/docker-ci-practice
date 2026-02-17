'use client';

import { useState } from 'react';
import { CloudDownload } from 'lucide-react';
import { AdminLayout } from '@/widgets/admin-layout/ui/admin-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { apiClient } from '@/shared/api/client';

export default function DatabaseBackupPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>(
    'success'
  );

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessageType(type);
    setMessage(text);
  };

  const handleDownload = async () => {
    setMessage(null);
    setIsDownloading(true);
    try {
      const blob = await apiClient.downloadDatabaseBackup();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `db-backup-${new Date()
        .toISOString()
        .replace(/[:.]/g, '-')}.sql`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      showMessage('success', 'SQL дамп успешно скачан');
    } catch (error) {
      console.error('Failed to download backup', error);
      showMessage('error', 'Не удалось скачать SQL дамп. Попробуйте позже.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AdminLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Резервные копии базы данных
          </h1>
          <p className="text-muted-foreground text-sm">
            Скачайте pg_dump SQL дамп или восстановите базу, загрузив файл.
            Раздел доступен только администраторам.
          </p>
        </div>

        {message && (
          <div
            className={`rounded-lg border px-4 py-2 text-sm ${messageType === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CloudDownload className="h-5 w-5" />
                Скачать бэкап
              </CardTitle>
              <CardDescription>
                Запускает pg_dump и возвращает готовый SQL файл, который можно
                хранить локально или в облачном хранилище.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? 'Готовим бэкап...' : 'Скачать бэкап'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
