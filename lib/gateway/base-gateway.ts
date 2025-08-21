export interface EmailService {
  sendInviteEmail(email: string, inviteCode: string, organizationName: string): Promise<boolean>;
  sendWelcomeEmail(email: string, name: string): Promise<boolean>;
}

export interface NotificationService {
  sendPushNotification(userId: string, title: string, message: string): Promise<boolean>;
  scheduleReminder(userId: string, message: string, scheduledAt: Date): Promise<string>;
}

export interface AnalyticsService {
  trackEvent(event: string, properties: Record<string, unknown>): Promise<void>;
  trackUserAction(userId: string, action: string, properties?: Record<string, unknown>): Promise<void>;
}

export interface StorageService {
  uploadFile(file: Buffer, filename: string): Promise<string>;
  deleteFile(filename: string): Promise<boolean>;
  getSignedUrl(filename: string, expiresInSeconds?: number): Promise<string>;
}