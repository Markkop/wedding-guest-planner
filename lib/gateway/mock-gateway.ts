import type { 
  EmailService, 
  NotificationService, 
  AnalyticsService, 
  StorageService 
} from './base-gateway';

export class MockEmailService implements EmailService {
  async sendInviteEmail(email: string, inviteCode: string, organizationName: string): Promise<boolean> {
    console.log(`[MOCK EMAIL] Invite sent to ${email} for ${organizationName} with code: ${inviteCode}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    console.log(`[MOCK EMAIL] Welcome email sent to ${name} at ${email}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }
}

export class MockNotificationService implements NotificationService {
  async sendPushNotification(userId: string, title: string, message: string): Promise<boolean> {
    console.log(`[MOCK PUSH] To ${userId}: ${title} - ${message}`);
    await new Promise(resolve => setTimeout(resolve, 50));
    return true;
  }

  async scheduleReminder(userId: string, message: string, scheduledAt: Date): Promise<string> {
    const reminderId = `reminder_${Date.now()}`;
    console.log(`[MOCK REMINDER] Scheduled ${reminderId} for ${userId} at ${scheduledAt.toISOString()}: ${message}`);
    await new Promise(resolve => setTimeout(resolve, 50));
    return reminderId;
  }
}

export class MockAnalyticsService implements AnalyticsService {
  async trackEvent(event: string, properties: Record<string, any>): Promise<void> {
    console.log(`[MOCK ANALYTICS] Event: ${event}`, properties);
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  async trackUserAction(userId: string, action: string, properties?: Record<string, any>): Promise<void> {
    console.log(`[MOCK ANALYTICS] User ${userId} - ${action}`, properties || {});
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

export class MockStorageService implements StorageService {
  private files = new Map<string, Buffer>();

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    console.log(`[MOCK STORAGE] Uploading ${filename} (${file.length} bytes)`);
    this.files.set(filename, file);
    await new Promise(resolve => setTimeout(resolve, 200));
    return `https://mock-storage.com/${filename}`;
  }

  async deleteFile(filename: string): Promise<boolean> {
    console.log(`[MOCK STORAGE] Deleting ${filename}`);
    const existed = this.files.delete(filename);
    await new Promise(resolve => setTimeout(resolve, 100));
    return existed;
  }

  async getSignedUrl(filename: string, expiresInSeconds = 3600): Promise<string> {
    console.log(`[MOCK STORAGE] Creating signed URL for ${filename} (expires in ${expiresInSeconds}s)`);
    await new Promise(resolve => setTimeout(resolve, 50));
    return `https://mock-storage.com/${filename}?signed=true&expires=${Date.now() + (expiresInSeconds * 1000)}`;
  }
}