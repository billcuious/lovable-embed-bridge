
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectManager } from './lovable-integration/ProjectManager';
import { LovableEmbed } from './lovable-integration/LovableEmbed';
import { AuthManager } from './lovable-integration/AuthManager';

export const LovableIntegration = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProjects, setUserProjects] = useState<any[]>([]);

  useEffect(() => {
    // Check if user is authenticated with Lovable
    const checkAuth = () => {
      const lovableAuth = localStorage.getItem('lovable_auth_token');
      setIsAuthenticated(!!lovableAuth);
    };
    
    checkAuth();
  }, []);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    console.log('Selected project:', projectId);
  };

  const handleAuthSuccess = (token: string) => {
    localStorage.setItem('lovable_auth_token', token);
    setIsAuthenticated(true);
    console.log('Authentication successful');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lovable Integration Platform
          </h1>
          <p className="text-gray-600">
            Connect your repositories and edit them using the Lovable interface
          </p>
        </div>

        {!isAuthenticated ? (
          <AuthManager onAuthSuccess={handleAuthSuccess} />
        ) : (
          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="projects">My Projects</TabsTrigger>
              <TabsTrigger value="editor">Lovable Editor</TabsTrigger>
            </TabsList>
            
            <TabsContent value="projects" className="space-y-4">
              <ProjectManager 
                onProjectSelect={handleProjectSelect}
                userProjects={userProjects}
                setUserProjects={setUserProjects}
              />
            </TabsContent>
            
            <TabsContent value="editor" className="space-y-4">
              {selectedProject ? (
                <LovableEmbed projectId={selectedProject} />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-gray-500">
                      Please select a project from the Projects tab to start editing
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};
