import type {
  EmailService,
  NotificationService,
  AnalyticsService,
  StorageService,
} from './base-gateway';

import {
  MockEmailService,
  MockNotificationService,
  MockAnalyticsService,
  MockStorageService,
} from './mock-gateway';

class GatewayManager {
  private emailService: EmailService;
  private notificationService: NotificationService;
  private analyticsService: AnalyticsService;
  private storageService: StorageService;

  constructor() {
    this.emailService = new MockEmailService();
    this.notificationService = new MockNotificationService();
    this.analyticsService = new MockAnalyticsService();
    this.storageService = new MockStorageService();
  }

  get email(): EmailService {
    return this.emailService;
  }

  get notifications(): NotificationService {
    return this.notificationService;
  }

  get analytics(): AnalyticsService {
    return this.analyticsService;
  }

  get storage(): StorageService {
    return this.storageService;
  }

  setEmailService(service: EmailService): void {
    this.emailService = service;
  }

  setNotificationService(service: NotificationService): void {
    this.notificationService = service;
  }

  setAnalyticsService(service: AnalyticsService): void {
    this.analyticsService = service;
  }

  setStorageService(service: StorageService): void {
    this.storageService = service;
  }
}

export const gateway = new GatewayManager();