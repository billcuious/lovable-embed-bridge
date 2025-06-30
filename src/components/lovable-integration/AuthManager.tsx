
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink } from 'lucide-react';

interface AuthManagerProps {
  onAuthSuccess: (token: string) => void;
}

export const AuthManager: React.FC<AuthManagerProps> = ({ onAuthSuccess }) => {
  const [authToken, setAuthToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLovableAuth = () => {
    // Open Lovable in a new window for authentication
    const lovableWindow = window.open(
      'https://lovable.dev/login',
      'lovable-auth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    // Listen for auth completion (this would need to be implemented with proper OAuth flow)
    const checkAuth = setInterval(() => {
      try {
        if (lovableWindow?.closed) {
          clearInterval(checkAuth);
          // In a real implementation, you'd get the token from the OAuth flow
          console.log('Lovable auth window closed');
        }
      } catch (e) {
        console.log('Auth window check failed:', e);
      }
    }, 1000);
  };

  const handleManualAuth = async () => {
    if (!authToken.trim()) {
      setError('Please enter an authentication token');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate auth validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you'd validate the token with Lovable's API
      onAuthSuccess(authToken);
    } catch (err) {
      setError('Authentication failed. Please check your token.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Connect to Lovable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              You need to authenticate with Lovable to access your projects and use the editor.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <Button 
              onClick={handleLovableAuth}
              className="w-full"
              variant="outline"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Login with Lovable
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or use manual token
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auth-token">Authentication Token</Label>
              <Input
                id="auth-token"
                type="password"
                placeholder="Enter your Lovable auth token"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                You can get this from your Lovable account settings
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleManualAuth}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Authenticating...' : 'Connect'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
