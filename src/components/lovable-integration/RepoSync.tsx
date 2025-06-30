
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, GitBranch, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { lovableApi, SyncStatus } from './api/lovableApi';

interface RepoSyncProps {
  projectId: string;
  repoUrl: string;
}

export const RepoSync: React.FC<RepoSyncProps> = ({ projectId, repoUrl }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSyncStatus();
    
    // Poll sync status every 30 seconds
    const interval = setInterval(loadSyncStatus, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  const loadSyncStatus = async () => {
    try {
      const status = await lovableApi.getSyncStatus(projectId);
      setSyncStatus(status);
      setError('');
    } catch (err) {
      console.error('Failed to load sync status:', err);
      setError('Failed to load sync status');
    }
  };

  const handleSync = async (force: boolean = false) => {
    setIsLoading(true);
    setError('');
    
    try {
      const status = await lovableApi.syncProject(projectId, force);
      setSyncStatus(status);
    } catch (err) {
      setError('Sync failed. Please try again.');
      console.error('Sync error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSyncStatusIcon = () => {
    if (!syncStatus) return <RefreshCw className="w-4 h-4" />;
    
    if (syncStatus.inProgress) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    
    if (syncStatus.lastSync) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const getSyncStatusText = () => {
    if (!syncStatus) return 'Unknown';
    
    if (syncStatus.inProgress) return 'Syncing...';
    if (syncStatus.lastSync) {
      const date = new Date(syncStatus.lastSync);
      return `Last synced: ${date.toLocaleString()}`;
    }
    
    return 'Never synced';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Repository Sync</CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            {getSyncStatusIcon()}
            {syncStatus?.inProgress ? 'Syncing' : 'Ready'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <GitBranch className="w-4 h-4" />
          <span className="truncate">{repoUrl}</span>
        </div>
        
        <div className="text-sm text-gray-500">
          {getSyncStatusText()}
        </div>

        {syncStatus?.changes && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Changes:</h4>
            <div className="text-sm text-gray-600">
              <p>{syncStatus.changes.files.length} files modified</p>
              {syncStatus.changes.commits.slice(0, 3).map((commit, index) => (
                <div key={index} className="text-xs bg-gray-50 p-2 rounded mt-1">
                  <p className="font-mono">{commit.hash.substring(0, 7)}</p>
                  <p>{commit.message}</p>
                  <p className="text-gray-500">by {commit.author}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => handleSync()}
            disabled={isLoading || syncStatus?.inProgress}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
          <Button
            onClick={() => handleSync(true)}
            variant="outline"
            disabled={isLoading || syncStatus?.inProgress}
            size="sm"
          >
            Force Sync
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
