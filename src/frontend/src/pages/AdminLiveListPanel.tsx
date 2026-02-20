import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, List, Trash2, AlertTriangle, X } from 'lucide-react';
import {
  useGetAllAppEvents,
  useCreateAppEvent,
  useAddUsernamesToAppEvent,
  useRemoveUsernameFromAppEvent,
  useResetAppEventUsernames,
  useDeleteAppEvent,
} from '../hooks/useAdminLiveListQueries';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminLiveListPanel() {
  const [newAppName, setNewAppName] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [usernamesText, setUsernamesText] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteUsernameDialog, setShowDeleteUsernameDialog] = useState(false);
  const [usernameToDelete, setUsernameToDelete] = useState<string | null>(null);

  const { data: appEvents = [], isLoading } = useGetAllAppEvents();
  const { mutate: createAppEvent, isPending: isCreating } = useCreateAppEvent();
  const { mutate: addUsernames, isPending: isAdding } = useAddUsernamesToAppEvent();
  const { mutate: removeUsername, isPending: isRemoving } = useRemoveUsernameFromAppEvent();
  const { mutate: resetUsernames, isPending: isResetting } = useResetAppEventUsernames();
  const { mutate: deleteAppEvent, isPending: isDeleting } = useDeleteAppEvent();

  const selectedApp = appEvents.find((app) => app.id === selectedAppId);

  const handleCreateApp = () => {
    if (!newAppName.trim()) {
      toast.error('Please enter an app/event name');
      return;
    }

    createAppEvent(newAppName.trim(), {
      onSuccess: () => {
        setNewAppName('');
      },
    });
  };

  const handleAddUsernames = () => {
    if (!selectedAppId) {
      toast.error('Please select an app/event');
      return;
    }

    if (!usernamesText.trim()) {
      toast.error('Please enter at least one username');
      return;
    }

    const usernames = usernamesText
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (usernames.length === 0) {
      toast.error('Please enter valid usernames');
      return;
    }

    addUsernames(
      { appEventId: selectedAppId, usernames },
      {
        onSuccess: () => {
          setUsernamesText('');
        },
      }
    );
  };

  const handleDeleteUsername = (username: string) => {
    setUsernameToDelete(username);
    setShowDeleteUsernameDialog(true);
  };

  const confirmDeleteUsername = () => {
    if (!selectedAppId || !usernameToDelete) return;

    removeUsername(
      { appEventId: selectedAppId, username: usernameToDelete },
      {
        onSuccess: () => {
          setShowDeleteUsernameDialog(false);
          setUsernameToDelete(null);
        },
      }
    );
  };

  const handleResetAll = () => {
    if (!selectedAppId) return;

    resetUsernames(selectedAppId, {
      onSuccess: () => {
        setShowResetDialog(false);
      },
    });
  };

  const handleDeleteApp = () => {
    if (!selectedAppId) return;

    deleteAppEvent(selectedAppId, {
      onSuccess: () => {
        setSelectedAppId(null);
        setShowDeleteDialog(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-slide-in">
      {/* Create New App/Event */}
      <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="relative bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Plus className="w-5 h-5 text-white" />
            </div>
            Create New App/Event
          </CardTitle>
          <CardDescription className="text-base">
            Add a new app or event to track usernames
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 relative pt-6">
          <div className="space-y-2">
            <Label htmlFor="appName" className="text-sm font-semibold">
              App/Event Name
            </Label>
            <Input
              id="appName"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              placeholder="Enter app or event name..."
              className="h-12 text-base rounded-2xl border-2"
            />
          </div>

          <Button
            onClick={handleCreateApp}
            disabled={!newAppName.trim() || isCreating}
            className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            size="lg"
          >
            {isCreating ? (
              <>
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-6 h-6 mr-2" />
                Create App/Event
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Manage Apps/Events */}
      <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="relative bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg">
              <List className="w-5 h-5 text-white" />
            </div>
            Manage Apps/Events
          </CardTitle>
          <CardDescription className="text-base">
            Add usernames and manage existing apps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 relative pt-6">
          <div className="space-y-2">
            <Label htmlFor="selectApp" className="text-sm font-semibold">
              Select App/Event
            </Label>
            <Select value={selectedAppId || ''} onValueChange={setSelectedAppId}>
              <SelectTrigger
                id="selectApp"
                className="w-full h-12 text-base rounded-2xl border-2"
              >
                <SelectValue placeholder="Choose an app/event..." />
              </SelectTrigger>
              <SelectContent>
                {appEvents.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No apps/events created yet
                  </div>
                ) : (
                  appEvents.map((app) => (
                    <SelectItem key={app.id} value={app.id} className="text-base">
                      {app.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedApp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="usernames" className="text-sm font-semibold">
                  Add Usernames
                </Label>
                <Textarea
                  id="usernames"
                  value={usernamesText}
                  onChange={(e) => setUsernamesText(e.target.value)}
                  placeholder="user1, user2, user3&#10;or one per line..."
                  rows={4}
                  className="rounded-2xl border-2 text-base resize-none"
                />
              </div>

              <Button
                onClick={handleAddUsernames}
                disabled={!usernamesText.trim() || isAdding}
                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                {isAdding ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-6 h-6 mr-2" />
                    Add Usernames
                  </>
                )}
              </Button>

              {/* Current Usernames */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Current Usernames ({selectedApp.usernames.length})
                  </Label>
                  {selectedApp.usernames.length > 0 && (
                    <Button
                      onClick={() => setShowResetDialog(true)}
                      variant="outline"
                      size="sm"
                      className="h-9 px-4 rounded-xl border-2 border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Reset All
                    </Button>
                  )}
                </div>

                {selectedApp.usernames.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No usernames added yet
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 p-4">
                    <div className="space-y-2">
                      {selectedApp.usernames.map((username, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-blue-200/50 dark:border-blue-800/50"
                        >
                          <span className="font-medium">{username}</span>
                          <Button
                            onClick={() => handleDeleteUsername(username)}
                            disabled={isRemoving}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-red-500/10 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Delete App Button */}
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="outline"
                className="w-full h-12 rounded-2xl border-2 border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-bold"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete App/Event
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* All Apps/Events Overview */}
      <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="relative bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">All Apps/Events ({appEvents.length})</CardTitle>
              <CardDescription className="text-base">
                Overview of all tracked apps and events
              </CardDescription>
            </div>
            {appEvents.length > 0 && (
              <Badge
                variant="outline"
                className="text-lg px-4 py-1.5 rounded-xl border-2 border-blue-500/50 font-bold"
              >
                {appEvents.reduce((sum, app) => sum + app.usernames.length, 0)} total usernames
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="relative pt-6">
          {appEvents.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-teal-500/20 flex items-center justify-center mx-auto">
                <List className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-semibold mb-2">No apps/events created yet</p>
                <p className="text-muted-foreground">Create your first app/event above</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appEvents.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white/50 dark:bg-gray-900/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">{app.name}</h3>
                    <Badge variant="outline" className="text-sm px-3 py-1 rounded-xl border-2">
                      {app.usernames.length} users
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Usernames?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all usernames from "{selectedApp?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetAll}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isResetting ? 'Resetting...' : 'Reset All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete App Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete App/Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedApp?.name}" and all its usernames. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteApp}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Username Confirmation Dialog */}
      <AlertDialog open={showDeleteUsernameDialog} onOpenChange={setShowDeleteUsernameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Username?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{usernameToDelete}" from this app/event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUsernameToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUsername}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
