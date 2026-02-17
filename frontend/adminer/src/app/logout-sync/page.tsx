'use client';

import { useEffect } from 'react';
import { clearAdminSession } from '@/shared/lib/admin-auth';

export default function LogoutSyncPage() {
  useEffect(() => {
    clearAdminSession();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Завершаем админскую сессию...
    </div>
  );
}

