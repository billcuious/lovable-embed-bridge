
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, GitBranch, ExternalLink, Trash2 } from 'lucide-react';
import { lovableApi } from './api/lovableApi';

interface Project {
  id: string;
  name: string;
  repoUrl: string;
  lovableProjectId?: string;
  status: 'connected' | 'pending' | 'error';
  lastSync?: string;
}

interface ProjectManagerProps {
  onProjectSelect: (projectId: string) => void;
  userProjects: Project[];
  setUserProjects: (projects: Project[]) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  onProjectSelect,
  userProjects,
  setUserProjects
}) => {
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    repoUrl: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUserProjects();
  }, []);

  const loadUserProjects = async () => {
    try {
      // Load projects from localStorage or API
      const savedProjects = localStorage.getItem('user_projects');
      if (savedProjects) {
        setUserProjects(JSON.parse(savedProjects));
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleAddProject = async () => {
    if (!newProject.name.trim() || !newProject.repoUrl.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const project: Project = {
        id: Date.now().toString(),
        name: newProject.name,
        repoUrl: newProject.repoUrl,
        status: 'pending'
      };

      // In a real implementation, this would create a Lovable project
      const lovableProject = await lovableApi.createProject({
        name: project.name,
        repoUrl: project.repoUrl
      });

      project.lovableProjectId = lovableProject.id;
      project.status = 'connected';

      const updatedProjects = [...userProjects, project];
      setUserProjects(updatedProjects);
      localStorage.setItem('user_projects', JSON.stringify(updatedProjects));

      setNewProject({ name: '', repoUrl: '' });
      setShowAddProject(false);
    } catch (error) {
      console.error('Failed to add project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const updatedProjects = userProjects.filter(p => p.id !== projectId);
    setUserProjects(updatedProjects);
    localStorage.setItem('user_projects', JSON.stringify(updatedProjects));
  };

  const handleSyncProject = async (projectId: string) => {
    const project = userProjects.find(p => p.id === projectId);
    if (!project) return;

    try {
      // Sync with Lovable API
      await lovableApi.syncProject(project.lovableProjectId || '');
      
      const updatedProjects = userProjects.map(p =>
        p.id === projectId
          ? { ...p, lastSync: new Date().toISOString(), status: 'connected' as const }
          : p
      );
      setUserProjects(updatedProjects);
      localStorage.setItem('user_projects', JSON.stringify(updatedProjects));
    } catch (error) {
      console.error('Failed to sync project:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Your Projects</h2>
        <Button onClick={() => setShowAddProject(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>

      {showAddProject && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="My Awesome Project"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repo-url">Repository URL</Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/username/repo"
                value={newProject.repoUrl}
                onChange={(e) => setNewProject(prev => ({ ...prev, repoUrl: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddProject} disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Project'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddProject(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userProjects.map((project) => (
          <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge variant={
                  project.status === 'connected' ? 'default' :
                  project.status === 'pending' ? 'secondary' : 'destructive'
                }>
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <GitBranch className="w-4 h-4 mr-2" />
                <span className="truncate">{project.repoUrl}</span>
              </div>
              
              {project.lastSync && (
                <p className="text-xs text-gray-500">
                  Last sync: {new Date(project.lastSync).toLocaleString()}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => project.lovableProjectId && onProjectSelect(project.lovableProjectId)}
                  disabled={project.status !== 'connected'}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSyncProject(project.id)}
                  disabled={project.status !== 'connected'}
                >
                  Sync
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteProject(project.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {userProjects.length === 0 && !showAddProject && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-500 mb-4">No projects yet</p>
              <Button onClick={() => setShowAddProject(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
