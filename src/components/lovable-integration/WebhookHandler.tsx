
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { WebhookPayload, lovableApi } from './api/lovableApi';

interface WebhookHandlerProps {
  projectId: string;
  onWebhookReceived?: (payload: WebhookPayload) => void;
}

export const WebhookHandler: React.FC<WebhookHandlerProps> = ({
  projectId,
  onWebhookReceived
}) => {
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'listening' | 'received' | 'error'>('idle');
  const [lastWebhook, setLastWebhook] = useState<WebhookPayload | null>(null);

  useEffect(() => {
    // Set up webhook listener
    const handleWebhook = (event: CustomEvent<WebhookPayload>) => {
      const payload = event.detail;
      
      if (payload.projectId === projectId) {
        setLastWebhook(payload);
        setWebhookStatus('received');
        onWebhookReceived?.(payload);
        
        // Reset status after 3 seconds
        setTimeout(() => setWebhookStatus('listening'), 3000);
      }
    };

    window.addEventListener('lovable-webhook' as any, handleWebhook);
    setWebhookStatus('listening');

    return () => {
      window.removeEventListener('lovable-webhook' as any, handleWebhook);
      setWebhookStatus('idle');
    };
  }, [projectId, onWebhookReceived]);

  const getStatusColor = () => {
    switch (webhookStatus) {
      case 'listening': return 'secondary';
      case 'received': return 'default';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusText = () => {
    switch (webhookStatus) {
      case 'listening': return 'Listening for updates';
      case 'received': return 'Update received';
      case 'error': return 'Webhook error';
      default: return 'Webhook inactive';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={getStatusColor()}>
          {getStatusText()}
        </Badge>
        {lastWebhook && (
          <span className="text-xs text-gray-500">
            Last: {new Date(lastWebhook.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
      
      {lastWebhook && (
        <Alert>
          <AlertDescription>
            <strong>{lastWebhook.event}:</strong> {lastWebhook.data.message || 'Project updated'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Utility function to simulate webhook reception (for testing)
export const simulateWebhook = (payload: WebhookPayload) => {
  const event = new CustomEvent('lovable-webhook', { detail: payload });
  window.dispatchEvent(event);
};
