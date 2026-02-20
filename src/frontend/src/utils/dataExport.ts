import { toast } from 'sonner';

const ADMIN_ACCESS_CODE = '5676';

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function convertToCSV(data: any[], headers: string[]): string {
  const rows = [headers.join(',')];
  
  data.forEach((item) => {
    const values = headers.map((header) => {
      const value = item[header];
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma or newline
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    rows.push(values.join(','));
  });
  
  return rows.join('\n');
}

export async function exportAllData(): Promise<void> {
  try {
    toast.info('Preparing data export...');

    // Get actor from window (injected by useActor)
    const actor = (window as any).__actor__;
    if (!actor) {
      throw new Error('Backend actor not available');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Fetch all data
    const [commentListIds, appEvents, allMessages] = await Promise.all([
      actor.getCommentListIds(),
      actor.getAllAppEvents(ADMIN_ACCESS_CODE),
      actor.getAllMessages(ADMIN_ACCESS_CODE),
    ]);

    // Fetch comments for each list
    const commentsData: any[] = [];
    for (const listId of commentListIds) {
      const comments = await actor.getCommentList(ADMIN_ACCESS_CODE, listId);
      comments.forEach((comment: any) => {
        commentsData.push({
          listId,
          id: comment.id,
          content: comment.content,
          used: comment.used,
          timestamp: new Date(Number(comment.timestamp) / 1000000).toISOString(),
        });
      });
    }

    // Export Comments as CSV
    if (commentsData.length > 0) {
      const commentsCSV = convertToCSV(commentsData, ['listId', 'id', 'content', 'used', 'timestamp']);
      downloadFile(commentsCSV, `comments_${timestamp}.csv`, 'text/csv');
    }

    // Export Comments as JSON
    if (commentsData.length > 0) {
      const commentsJSON = JSON.stringify(commentsData, null, 2);
      downloadFile(commentsJSON, `comments_${timestamp}.json`, 'application/json');
    }

    // Export App Events as CSV
    const appEventsData = appEvents.map((app: any) => ({
      id: app.id,
      name: app.name,
      usernameCount: app.usernames.length,
      usernames: app.usernames.join('; '),
      createdAt: new Date(Number(app.createdAt) / 1000000).toISOString(),
    }));

    if (appEventsData.length > 0) {
      const appEventsCSV = convertToCSV(appEventsData, ['id', 'name', 'usernameCount', 'usernames', 'createdAt']);
      downloadFile(appEventsCSV, `app_events_${timestamp}.csv`, 'text/csv');
    }

    // Export App Events as JSON
    if (appEvents.length > 0) {
      const appEventsJSON = JSON.stringify(appEvents, null, 2);
      downloadFile(appEventsJSON, `app_events_${timestamp}.json`, 'application/json');
    }

    // Export Messages as CSV
    const messagesData = allMessages.map((msg: any) => ({
      id: msg.id,
      side: msg.side,
      content: msg.content,
      isRead: msg.isRead,
      timestamp: new Date(Number(msg.timestamp) / 1000000).toISOString(),
    }));

    if (messagesData.length > 0) {
      const messagesCSV = convertToCSV(messagesData, ['id', 'side', 'content', 'isRead', 'timestamp']);
      downloadFile(messagesCSV, `messages_${timestamp}.csv`, 'text/csv');
    }

    // Export Messages as JSON
    if (allMessages.length > 0) {
      const messagesJSON = JSON.stringify(allMessages, null, 2);
      downloadFile(messagesJSON, `messages_${timestamp}.json`, 'application/json');
    }

    toast.success('Data exported successfully!');
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
}
