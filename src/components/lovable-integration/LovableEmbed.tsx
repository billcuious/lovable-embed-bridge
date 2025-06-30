
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

interface LovableEmbedProps {
  projectId: string;
}

export const LovableEmbed: React.FC<LovableEmbedProps> = ({ projectId }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState('');

  useEffect(() => {
    // Construct the Lovable embed URL
    // In a real implementation, this would be the actual Lovable project URL
    const lovableProjectUrl = `https://lovable.dev/projects/${projectId}`;
    setEmbedUrl(lovableProjectUrl);
    
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [projectId]);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Force iframe reload
    const iframe = document.getElementById('lovable-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleOpenInNewTab = () => {
    window.open(embedUrl, '_blank');
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <Card className={`${isFullscreen ? 'h-full' : 'h-[800px]'}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CardTitle>Lovable Editor</CardTitle>
              <Badge variant="secondary">Project: {projectId}</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleOpenInNewTab}>
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleFullscreen}>
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-full">
          <div className="relative h-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading Lovable Editor...</p>
                </div>
              </div>
            )}
            
            <iframe
              id="lovable-iframe"
              src={embedUrl}
              className="w-full h-full border-0 rounded-b-lg"
              title="Lovable Editor"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Instructions for real implementation */}
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Implementation Note:</strong> In a real implementation, you would need to:
        </p>
        <ul className="list-disc list-inside text-sm text-yellow-700 mt-2 space-y-1">
          <li>Set up proper OAuth flow with Lovable for authentication</li>
          <li>Use Lovable's actual API endpoints for project management</li>
          <li>Handle cross-origin iframe communication properly</li>
          <li>Implement proper error handling and loading states</li>
          <li>Add security measures for iframe embedding</li>
        </ul>
      </div>
    </div>
  );
};
