'use client';

import React, { ReactNode, useCallback } from 'react';
import { Button } from './button';
import { useToast } from './toast';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type BoundaryState = {
  hasError: boolean;
};

type BoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
};

class Boundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

export function ErrorBoundaryWithToast({ children, fallback }: ErrorBoundaryProps) {
  const { showToast } = useToast();

  const handleError = useCallback(
    (error: Error) => {
      console.error('Unhandled error', error);
      showToast(error.message || 'Что-то пошло не так', 'error');
    },
    [showToast]
  );

  return <Boundary onError={handleError} fallback={fallback ?? <DefaultFallback />}>{children}</Boundary>;
}

function DefaultFallback() {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-border bg-background p-6 text-center">
      <p className="text-lg font-semibold">Что-то пошло не так</p>
      <p className="text-sm text-muted-foreground">Попробуйте обновить страницу или повторить действие позже.</p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Обновить страницу
      </Button>
    </div>
  );
}
