
// Lovable API integration utilities
// This is a mock implementation - replace with actual Lovable API calls

const LOVABLE_API_BASE = 'https://api.lovable.dev'; // Replace with actual API endpoint
const LOVABLE_APP_BASE = 'https://lovable.dev';

interface CreateProjectRequest {
  name: string;
  repoUrl: string;
  description?: string;
}

interface LovableProject {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface LovableUser {
  id: string;
  email: string;
  name: string;
  projects: LovableProject[];
}

class LovableApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('lovable_auth_token');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${LOVABLE_API_BASE}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Lovable API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async authenticate(token: string): Promise<LovableUser> {
    // Mock implementation - replace with actual auth validation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (token.length > 10) {
          resolve({
            id: 'user-123',
            email: 'user@example.com',
            name: 'Test User',
            projects: []
          });
        } else {
          reject(new Error('Invalid token'));
        }
      }, 1000);
    });
  }

  async getCurrentUser(): Promise<LovableUser> {
    // Mock implementation
    return this.makeRequest('/user');
  }

  // Project management methods
  async createProject(data: CreateProjectRequest): Promise<LovableProject> {
    console.log('Creating Lovable project:', data);
    
    // Mock implementation - replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `project-${Date.now()}`,
          name: data.name,
          url: `${LOVABLE_APP_BASE}/projects/project-${Date.now()}`,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }, 1500);
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

  async syncProject(projectId: string): Promise<void> {
    console.log('Syncing project:', projectId);
    
    // Mock implementation - replace with actual sync API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });
  }

  // Repository integration methods
  async connectRepository(projectId: string, repoUrl: string): Promise<void> {
    return this.makeRequest(`/projects/${projectId}/repository`, {
      method: 'POST',
      body: JSON.stringify({ repoUrl }),
    });
  }

  async getRepositoryStatus(projectId: string): Promise<{ connected: boolean; lastSync?: string }> {
    return this.makeRequest(`/projects/${projectId}/repository/status`);
  }

  // Embedding and iframe methods
  getEmbedUrl(projectId: string, options?: { 
    theme?: 'light' | 'dark';
    hideHeader?: boolean;
    autoSave?: boolean;
  }): string {
    const params = new URLSearchParams();
    
    if (options?.theme) params.append('theme', options.theme);
    if (options?.hideHeader) params.append('hideHeader', 'true');
    if (options?.autoSave) params.append('autoSave', 'true');
    
    const queryString = params.toString();
    return `${LOVABLE_APP_BASE}/projects/${projectId}/embed${queryString ? `?${queryString}` : ''}`;
  }

  // Webhook methods for real-time updates
  async setupWebhook(projectId: string, webhookUrl: string): Promise<void> {
    return this.makeRequest(`/projects/${projectId}/webhooks`, {
      method: 'POST',
      body: JSON.stringify({ url: webhookUrl }),
    });
  }
}

// Export singleton instance
export const lovableApi = new LovableApiClient();

// Export types for use in components
export type { LovableProject, LovableUser, CreateProjectRequest };

// Utility functions
export const getLovableProjectUrl = (projectId: string): string => {
  return `${LOVABLE_APP_BASE}/projects/${projectId}`;
};

export const isValidLovableUrl = (url: string): boolean => {
  return url.startsWith(LOVABLE_APP_BASE) || url.includes('lovable.dev');
};

// OAuth helpers for future implementation
export const initiateLovableOAuth = (): void => {
  const oauthUrl = `${LOVABLE_APP_BASE}/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code&scope=projects:read,projects:write`;
  window.location.href = oauthUrl;
};

export const handleOAuthCallback = async (code: string): Promise<string> => {
  const response = await fetch(`${LOVABLE_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: 'YOUR_CLIENT_ID',
      client_secret: 'YOUR_CLIENT_SECRET',
      grant_type: 'authorization_code',
    }),
  });
  
  const data = await response.json();
  return data.access_token;
};
