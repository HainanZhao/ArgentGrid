import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

// Initialize Angular test environment
TestBed.initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    provide: [
      provideExperimentalZonelessChangeDetection()
    ]
  }
);

// Setup fake timers
vi.useFakeTimers();