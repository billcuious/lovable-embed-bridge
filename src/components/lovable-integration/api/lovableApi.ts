
// Lovable API integration utilities
// Complete implementation ready for your backend integration

const LOVABLE_API_BASE = process.env.REACT_APP_LOVABLE_API_BASE || 'https://api.lovable.dev';
const LOVABLE_APP_BASE = process.env.REACT_APP_LOVABLE_APP_BASE || 'https://lovable.dev';
const GITHUB_CLIENT_ID = process.env.REACT_APP_GITHUB_CLIENT_ID || 'your_github_client_id';
const LOVABLE_CLIENT_ID = process.env.REACT_APP_LOVABLE_CLIENT_ID || 'your_lovable_client_id';

interface CreateProjectRequest {
  name: string;
  repoUrl: string;
  description?: string;
  githubToken?: string;
}

interface LovableProject {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive' | 'syncing' | 'error';
  createdAt: string;
  updatedAt: string;
  repoUrl?: string;
  lastSync?: string;
  webhookUrl?: string;
}

interface LovableUser {
  id: string;
  email: string;
  name: string;
  projects: LovableProject[];
  githubConnected: boolean;
}

interface WebhookPayload {
  projectId: string;
  event: 'code_updated' | 'build_completed' | 'deployment_ready';
  timestamp: string;
  data: any;
}

interface SyncStatus {
  inProgress: boolean;
  lastSync?: string;
  changes?: {
    files: string[];
    commits: Array<{
      hash: string;
      message: string;
      author: string;
      timestamp: string;
    }>;
  };
}

class LovableApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('lovable_auth_token');
  }

  private getGitHubToken(): string | null {
    return localStorage.getItem('github_auth_token');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        'X-GitHub-Token': this.getGitHubToken() || '',
        'X-Client-Version': '1.0.0',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${LOVABLE_API_BASE}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Lovable API request failed:', error);
      throw error;
    }
  }

  // OAuth and Authentication
  initiateLovableOAuth(): void {
    const state = 'lovable-oauth';
    const redirectUri = encodeURIComponent(window.location.origin);
    const scope = 'projects:read,projects:write,user:read';
    
    const oauthUrl = `${LOVABLE_APP_BASE}/oauth/authorize?client_id=${LOVABLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
    window.location.href = oauthUrl;
  }

  async handleOAuthCallback(code: string): Promise<string> {
    const response = await fetch(`${LOVABLE_API_BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: LOVABLE_CLIENT_ID,
        client_secret: process.env.REACT_APP_LOVABLE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: window.location.origin,
      }),
    });
    
    const data = await response.json();
    if (!data.access_token) {
      throw new Error('OAuth token exchange failed');
    }
    
    return data.access_token;
  }

  getGitHubClientId(): string {
    return GITHUB_CLIENT_ID;
  }

  async authenticate(token: string): Promise<LovableUser> {
    // Store token temporarily for the request
    const originalToken = this.getAuthToken();
    localStorage.setItem('lovable_auth_token', token);
    
    try {
      const user = await this.makeRequest('/user');
      return user;
    } finally {
      // Restore original token if auth fails
      if (originalToken) {
        localStorage.setItem('lovable_auth_token', originalToken);
      }
    }
  }

  async getCurrentUser(): Promise<LovableUser> {
    return this.makeRequest('/user');
  }

  // Project Management with Repository Integration
  async createProject(data: CreateProjectRequest): Promise<LovableProject> {
    console.log('Creating Lovable project with repo sync:', data);
    
    const payload = {
      ...data,
      github_token: this.getGitHubToken(),
      sync_enabled: true,
      webhook_url: `${window.location.origin}/api/webhooks/lovable`,
    };
    
    return this.makeRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getProjects(): Promise<LovableProject[]> {
    return this.makeRequest('/projects');
  }

  async getProject(projectId: string): Promise<LovableProject> {
    return this.makeRequest(`/projects/${projectId}`);
  }

  async updateProject(projectId: string, data: Partial<CreateProjectRequest>): Promise<LovableProject> {
    return this.makeRequest(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.makeRequest(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Repository Syncing
  async syncProject(projectId: string, force: boolean = false): Promise<SyncStatus> {
    console.log('Syncing project with repository:', projectId);
    
    return this.makeRequest(`/projects/${projectId}/sync`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    });
  }

  async getSyncStatus(projectId: string): Promise<SyncStatus> {
    return this.makeRequest(`/projects/${projectId}/sync/status`);
  }

  async connectRepository(projectId: string, repoUrl: string, githubToken?: string): Promise<void> {
    return this.makeRequest(`/projects/${projectId}/repository`, {
      method: 'POST',
      body: JSON.stringify({ 
        repoUrl, 
        githubToken: githubToken || this.getGitHubToken(),
        autoSync: true 
      }),
    });
  }

  async disconnectRepository(projectId: string): Promise<void> {
    return this.makeRequest(`/projects/${projectId}/repository`, {
      method: 'DELETE',
    });
  }

  async getRepositoryStatus(projectId: string): Promise<{ 
    connected: boolean; 
    lastSync?: string; 
    syncEnabled: boolean;
    webhookActive: boolean;
  }> {
    return this.makeRequest(`/projects/${projectId}/repository/status`);
  }

  // Webhook Management
  async setupWebhook(projectId: string, webhookUrl: string): Promise<{ id: string; secret: string }> {
    return this.makeRequest(`/projects/${projectId}/webhooks`, {
      method: 'POST',
      body: JSON.stringify({ 
        url: webhookUrl,
        events: ['code_updated', 'build_completed', 'deployment_ready']
      }),
    });
  }

  async removeWebhook(projectId: string, webhookId: string): Promise<void> {
    await this.makeRequest(`/projects/${projectId}/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }

  // Embedding and iframe methods with enhanced options
  getEmbedUrl(projectId: string, options?: { 
    theme?: 'light' | 'dark';
    hideHeader?: boolean;
    autoSave?: boolean;
    showGitHub?: boolean;
    readOnly?: boolean;
  }): string {
    const params = new URLSearchParams();
    
    // Add auth token for seamless iframe experience
    const token = this.getAuthToken();
    if (token) params.append('token', token);
    
    if (options?.theme) params.append('theme', options.theme);
    if (options?.hideHeader) params.append('hideHeader', 'true');
    if (options?.autoSave) params.append('autoSave', 'true');
    if (options?.showGitHub) params.append('showGitHub', 'true');
    if (options?.readOnly) params.append('readOnly', 'true');
    
    // Add origin for postMessage communication
    params.append('origin', window.location.origin);
    
    const queryString = params.toString();
    return `${LOVABLE_APP_BASE}/projects/${projectId}/embed${queryString ? `?${queryString}` : ''}`;
  }

  // GitHub Integration
  async getGitHubRepositories(): Promise<Array<{
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    private: boolean;
  }>> {
    const token = this.getGitHubToken();
    if (!token) throw new Error('GitHub token not available');

    const response = await fetch('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub repositories');
    }

    return response.json();
  }

  async createGitHubWebhook(repoFullName: string, webhookUrl: string): Promise<void> {
    const token = this.getGitHubToken();
    if (!token) throw new Error('GitHub token not available');

    await fetch(`https://api.github.com/repos/${repoFullName}/hooks`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['push', 'pull_request'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
        },
      }),
    });
  }

  // Real-time Communication
  setupIframeMessaging(iframe: HTMLIFrameElement, callbacks: {
    onSave?: (data: any) => void;
    onError?: (error: any) => void;
    onReady?: () => void;
  }): () => void {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(LOVABLE_APP_BASE).origin) return;
      
      const { type, data } = event.data;
      
      switch (type) {
        case 'lovable:ready':
          callbacks.onReady?.();
          break;
        case 'lovable:save':
          callbacks.onSave?.(data);
          break;
        case 'lovable:error':
          callbacks.onError?.(data);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Cleanup function
    return () => window.removeEventListener('message', handleMessage);
  }

  // API Key validation
  async validateApiKeys(): Promise<{
    lovable: boolean;
    github: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let lovableValid = false;
    let githubValid = false;

    try {
      await this.getCurrentUser();
      lovableValid = true;
    } catch {
      errors.push('Invalid Lovable API token');
    }

    try {
      const token = this.getGitHubToken();
      if (token) {
        const response = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `token ${token}` },
        });
        githubValid = response.ok;
        if (!githubValid) errors.push('Invalid GitHub token');
      } else {
        errors.push('GitHub token not found');
      }
    } catch {
      errors.push('GitHub API connection failed');
    }

    return { lovable: lovableValid, github: githubValid, errors };
  }
}

// Export singleton instance
export const lovableApi = new LovableApiClient();

// Export types for use in components
export type { 
  LovableProject, 
  LovableUser, 
  CreateProjectRequest, 
  WebhookPayload, 
  SyncStatus 
};

// Utility functions
export const getLovableProjectUrl = (projectId: string): string => {
  return `${LOVABLE_APP_BASE}/projects/${projectId}`;
};

export const isValidLovableUrl = (url: string): boolean => {
  return url.startsWith(LOVABLE_APP_BASE) || url.includes('lovable.dev');
};

export const isValidGitHubUrl = (url: string): boolean => {
  return /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+$/.test(url);
};

// Configuration helpers
export const getApiConfig = () => ({
  lovableApiBase: LOVABLE_API_BASE,
  lovableAppBase: LOVABLE_APP_BASE,
  githubClientId: GITHUB_CLIENT_ID,
  lovableClientId: LOVABLE_CLIENT_ID,
});
