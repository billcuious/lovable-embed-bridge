
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Key, Github } from 'lucide-react';
import { lovableApi } from './api/lovableApi';

interface AuthManagerProps {
  onAuthSuccess: (token: string) => void;
}

export const AuthManager: React.FC<AuthManagerProps> = ({ onAuthSuccess }) => {
  const [authToken, setAuthToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthInProgress, setOauthInProgress] = useState(false);

  useEffect(() => {
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === 'lovable-oauth') {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setIsLoading(true);
    setOauthInProgress(true);
    
    try {
      const token = await lovableApi.handleOAuthCallback(code);
      localStorage.setItem('lovable_auth_token', token);
      onAuthSuccess(token);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      setError('OAuth authentication failed. Please try again.');
      console.error('OAuth callback error:', error);
    } finally {
      setIsLoading(false);
      setOauthInProgress(false);
    }
  };

  const handleLovableOAuth = () => {
    setOauthInProgress(true);
    lovableApi.initiateLovableOAuth();
  };

  const handleManualAuth = async () => {
    if (!authToken.trim()) {
      setError('Please enter an authentication token');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await lovableApi.authenticate(authToken);
      localStorage.setItem('lovable_auth_token', authToken);
      localStorage.setItem('lovable_user', JSON.stringify(user));
      onAuthSuccess(authToken);
    } catch (err) {
      setError('Authentication failed. Please check your token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubAuth = () => {
    // GitHub OAuth for repository access
    const githubOAuthUrl = `https://github.com/login/oauth/authorize?client_id=${lovableApi.getGitHubClientId()}&redirect_uri=${encodeURIComponent(window.location.origin)}&scope=repo,user&state=github-oauth`;
    window.location.href = githubOAuthUrl;
  };

  if (oauthInProgress) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Completing authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Connect to Lovable</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Authenticate with Lovable and authorize GitHub access to sync your repositories.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <Button 
              onClick={handleLovableOAuth}
              className="w-full"
              variant="default"
              disabled={isLoading}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              OAuth with Lovable
            </Button>

            <Button 
              onClick={handleGitHubAuth}
              className="w-full"
              variant="outline"
              disabled={isLoading}
            >
              <Github className="w-4 h-4 mr-2" />
              Authorize GitHub Access
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
              <Label htmlFor="auth-token">
                <Key className="w-4 h-4 inline mr-2" />
                Authentication Token
              </Label>
              <Input
                id="auth-token"
                type="password"
                placeholder="Enter your Lovable auth token"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Get this from your Lovable account settings or use OAuth above
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
              variant="secondary"
            >
              {isLoading ? 'Authenticating...' : 'Connect with Token'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
