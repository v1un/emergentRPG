// Story Exporter Component - Story export interface with format options
// Provides PDF, Markdown, and text export with progress tracking

'use client';

import React, { useState, useEffect } from 'react';
import { 
  DocumentArrowDownIcon,
  DocumentTextIcon,
  DocumentIcon,
  CodeBracketIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ActionButton } from '@/components/ui/ActionButton';
import { Input } from '@/components/ui/Input';
import { StoryExportOptions, ExportProgress } from '@/types';
import { storyExportService } from '@/services/storyExportService';
import { useCurrentSession } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import { toast } from 'react-hot-toast';

interface StoryExporterProps {
  onClose?: () => void;
  className?: string;
}

export function StoryExporter({ onClose, className }: StoryExporterProps) {
  const currentSession = useCurrentSession();
  const [exportOptions, setExportOptions] = useState<StoryExportOptions>({
    format: 'markdown',
    includeCharacterInfo: true,
    includeWorldState: true,
    includeBookmarks: true,
    includeTimestamps: false,
  });
  const [availableFormats, setAvailableFormats] = useState<Array<{
    format: StoryExportOptions['format'];
    name: string;
    description: string;
    recommended: boolean;
  }>>([]);
  const [preview, setPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [activeExportId, setActiveExportId] = useState<string | null>(null);

  // Load available formats on mount
  useEffect(() => {
    if (currentSession) {
      loadAvailableFormats();
    }
  }, [currentSession?.session_id]);

  // Subscribe to export progress updates
  useEffect(() => {
    if (activeExportId) {
      const unsubscribe = storyExportService.subscribeToProgress(
        activeExportId,
        (progress) => {
          setExportProgress(progress);
          
          if (progress.status === 'complete' && progress.downloadUrl) {
            // Auto-download the file
            const link = document.createElement('a');
            link.href = progress.downloadUrl;
            link.download = `${currentSession?.character.name || 'story'}_export.${exportOptions.format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success('Export completed successfully!');
            setActiveExportId(null);
            setExportProgress(null);
          } else if (progress.status === 'error') {
            toast.error(progress.error || 'Export failed');
            setActiveExportId(null);
            setExportProgress(null);
          }
        }
      );

      return unsubscribe;
    }
  }, [activeExportId, exportOptions.format, currentSession?.character.name]);

  const loadAvailableFormats = async () => {
    if (!currentSession) return;

    try {
      const formats = await storyExportService.getAvailableFormats(currentSession.session_id);
      setAvailableFormats(formats);
      
      // Set recommended format as default
      const recommended = formats.find(f => f.recommended);
      if (recommended) {
        setExportOptions(prev => ({ ...prev, format: recommended.format }));
      }
    } catch (error) {
      console.error('Failed to load available formats:', error);
      toast.error('Failed to load export formats');
    }
  };

  const handleStartExport = async () => {
    if (!currentSession) return;

    try {
      const exportId = await storyExportService.startExport({
        sessionId: currentSession.session_id,
        options: exportOptions,
      });
      
      setActiveExportId(exportId);
      toast.success('Export started!');
    } catch (error) {
      console.error('Failed to start export:', error);
      toast.error('Failed to start export');
    }
  };

  const handleCancelExport = async () => {
    if (!activeExportId) return;

    try {
      await storyExportService.cancelExport(activeExportId);
      setActiveExportId(null);
      setExportProgress(null);
      toast.success('Export cancelled');
    } catch (error) {
      console.error('Failed to cancel export:', error);
      toast.error('Failed to cancel export');
    }
  };

  const handlePreview = async () => {
    if (!currentSession) return;

    try {
      const previewContent = await storyExportService.generatePreview(
        currentSession.session_id,
        exportOptions
      );
      setPreview(previewContent);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast.error('Failed to generate preview');
    }
  };

  const getFormatIcon = (format: StoryExportOptions['format']) => {
    switch (format) {
      case 'pdf':
        return <DocumentIcon className="h-5 w-5" />;
      case 'markdown':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'text':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'json':
        return <CodeBracketIcon className="h-5 w-5" />;
      default:
        return <DocumentIcon className="h-5 w-5" />;
    }
  };

  const getProgressIcon = (status: ExportProgress['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
    }
  };

  if (showPreview) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Export Preview</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
            >
              Back to Options
            </Button>
            <ActionButton
              action="download"
              onClick={handleStartExport}
              disabled={!!activeExportId}
            >
              Export Now
            </ActionButton>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-auto max-h-96">
              {preview}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Export Story</h3>
          <p className="text-muted-foreground">
            Export your adventure in various formats
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Export Progress */}
      {exportProgress && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {getProgressIcon(exportProgress.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{exportProgress.message}</span>
                  <span className="text-sm text-muted-foreground">
                    {exportProgress.progress}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress.progress}%` }}
                  />
                </div>
              </div>
              {exportProgress.status !== 'complete' && exportProgress.status !== 'error' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelExport}
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Export Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableFormats.map((format) => (
            <div
              key={format.format}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                exportOptions.format === format.format
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              )}
              onClick={() => setExportOptions(prev => ({ ...prev, format: format.format }))}
            >
              {getFormatIcon(format.format)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{format.name}</span>
                  {format.recommended && (
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{format.description}</p>
              </div>
              <div className={cn(
                'w-4 h-4 rounded-full border-2',
                exportOptions.format === format.format
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground'
              )} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={exportOptions.includeCharacterInfo}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  includeCharacterInfo: e.target.checked
                }))}
                className="rounded"
              />
              <span>Include character information</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={exportOptions.includeWorldState}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  includeWorldState: e.target.checked
                }))}
                className="rounded"
              />
              <span>Include world state</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={exportOptions.includeBookmarks}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  includeBookmarks: e.target.checked
                }))}
                className="rounded"
              />
              <span>Include bookmarks</span>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={exportOptions.includeTimestamps}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  includeTimestamps: e.target.checked
                }))}
                className="rounded"
              />
              <span>Include timestamps</span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Title (optional)</label>
            <Input
              placeholder={`${currentSession?.character.name || 'Character'}'s Adventure`}
              value={exportOptions.customTitle || ''}
              onChange={(e) => setExportOptions(prev => ({
                ...prev,
                customTitle: e.target.value
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <ActionButton
          action="view"
          onClick={handlePreview}
          disabled={!!activeExportId}
          className="flex-1"
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          Preview
        </ActionButton>
        <ActionButton
          action="download"
          onClick={handleStartExport}
          disabled={!!activeExportId}
          className="flex-1"
        >
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Export
        </ActionButton>
      </div>
    </div>
  );
}
