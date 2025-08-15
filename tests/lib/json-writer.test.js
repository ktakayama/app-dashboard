/**
 * Tests for JSON writer utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { writeAppsJson } from '../../scripts/lib/json-writer.js';
import { CLIError } from '../../scripts/lib/error-handler.js';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    access: vi.fn(),
    copyFile: vi.fn(),
    writeFile: vi.fn(),
    rename: vi.fn(),
    unlink: vi.fn(),
    readFile: vi.fn(),
    stat: vi.fn(),
  },
}));

describe('JSON Writer Module', () => {
  let mockLogger;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = {
      verbose: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    };

    // Mock current time for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('writeAppsJson', () => {
    const mockAppsData = [
      {
        id: 'test-app-1',
        name: 'Test App 1',
        repository: 'user/test-app-1',
      },
      {
        id: 'test-app-2',
        name: 'Test App 2',
        repository: 'user/test-app-2',
      },
    ];

    it('should write JSON file successfully with default path', async () => {
      // Mock successful file operations
      fs.mkdir.mockResolvedValue();
      fs.access.mockRejectedValue({ code: 'ENOENT' }); // No existing file
      fs.writeFile.mockResolvedValue();
      fs.rename.mockResolvedValue();
      fs.readFile.mockResolvedValue(
        JSON.stringify(
          {
            apps: mockAppsData,
            lastUpdated: '2025-01-15T10:30:00.000Z',
            totalApps: 2,
          },
          null,
          2
        )
      );
      fs.stat.mockResolvedValue({ size: 1024 });

      await writeAppsJson(mockAppsData, undefined, mockLogger);

      expect(fs.mkdir).toHaveBeenCalledWith('src/data', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        'src/data/apps.json.tmp',
        expect.stringContaining('"apps"'),
        'utf8'
      );
      expect(fs.rename).toHaveBeenCalledWith(
        'src/data/apps.json.tmp',
        'src/data/apps.json'
      );
      expect(mockLogger.success).toHaveBeenCalledWith(
        'JSON file written successfully: src/data/apps.json (1 KB)'
      );
      expect(mockLogger.success).toHaveBeenCalledWith('Total apps exported: 2');
    });

    it('should write JSON file successfully with custom path', async () => {
      const customPath = 'custom/path/output.json';

      fs.mkdir.mockResolvedValue();
      fs.access.mockRejectedValue({ code: 'ENOENT' });
      fs.writeFile.mockResolvedValue();
      fs.rename.mockResolvedValue();
      fs.readFile.mockResolvedValue(
        JSON.stringify(
          {
            apps: mockAppsData,
            lastUpdated: '2025-01-15T10:30:00.000Z',
            totalApps: 2,
          },
          null,
          2
        )
      );
      fs.stat.mockResolvedValue({ size: 2048 });

      await writeAppsJson(mockAppsData, customPath, mockLogger);

      expect(fs.mkdir).toHaveBeenCalledWith('custom/path', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        'custom/path/output.json.tmp',
        expect.any(String),
        'utf8'
      );
      expect(fs.rename).toHaveBeenCalledWith(
        'custom/path/output.json.tmp',
        customPath
      );
      expect(mockLogger.success).toHaveBeenCalledWith(
        'JSON file written successfully: custom/path/output.json (2 KB)'
      );
    });

    it('should create backup when existing file present', async () => {
      fs.mkdir.mockResolvedValue();
      fs.access.mockResolvedValue(); // File exists
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
      fs.rename.mockResolvedValue();
      fs.readFile.mockResolvedValue(
        JSON.stringify(
          {
            apps: mockAppsData,
            lastUpdated: '2025-01-15T10:30:00.000Z',
            totalApps: 2,
          },
          null,
          2
        )
      );
      fs.stat.mockResolvedValue({ size: 1024 });

      await writeAppsJson(mockAppsData, 'test-output.json', mockLogger);

      expect(fs.copyFile).toHaveBeenCalledWith(
        'test-output.json',
        'test-output.json.backup'
      );
      expect(mockLogger.verbose).toHaveBeenCalledWith(
        'Backup created: test-output.json.backup'
      );
    });

    it('should handle empty apps array', async () => {
      const emptyAppsData = [];

      fs.mkdir.mockResolvedValue();
      fs.access.mockRejectedValue({ code: 'ENOENT' });
      fs.writeFile.mockResolvedValue();
      fs.rename.mockResolvedValue();
      fs.readFile.mockResolvedValue(
        JSON.stringify(
          {
            apps: [],
            lastUpdated: '2025-01-15T10:30:00.000Z',
            totalApps: 0,
          },
          null,
          2
        )
      );
      fs.stat.mockResolvedValue({ size: 512 });

      await writeAppsJson(emptyAppsData, 'empty-output.json', mockLogger);

      expect(mockLogger.success).toHaveBeenCalledWith('Total apps exported: 0');
    });

    it('should clean up temporary file on write failure', async () => {
      fs.mkdir.mockResolvedValue();
      fs.access.mockRejectedValue({ code: 'ENOENT' });
      fs.writeFile.mockResolvedValue();
      fs.rename.mockRejectedValue(new Error('Rename failed'));
      fs.unlink.mockResolvedValue();

      await expect(
        writeAppsJson(mockAppsData, 'test-output.json', mockLogger)
      ).rejects.toThrow(CLIError);

      expect(fs.unlink).toHaveBeenCalledWith('test-output.json.tmp');
    });

    it('should throw CLIError for invalid apps data', async () => {
      await expect(
        writeAppsJson('not-an-array', 'test-output.json', mockLogger)
      ).rejects.toThrow(CLIError);

      await expect(
        writeAppsJson(null, 'test-output.json', mockLogger)
      ).rejects.toThrow(CLIError);
    });

    it('should throw CLIError for missing logger', async () => {
      await expect(
        writeAppsJson(mockAppsData, 'test-output.json', null)
      ).rejects.toThrow(CLIError);
    });

    it('should throw CLIError on directory creation failure', async () => {
      fs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(
        writeAppsJson(mockAppsData, 'test-output.json', mockLogger)
      ).rejects.toThrow(CLIError);
    });

    it('should throw CLIError on backup creation failure', async () => {
      fs.mkdir.mockResolvedValue();
      fs.access.mockResolvedValue(); // File exists
      fs.copyFile.mockRejectedValue(new Error('Backup failed'));

      await expect(
        writeAppsJson(mockAppsData, 'test-output.json', mockLogger)
      ).rejects.toThrow(CLIError);
    });

    it('should throw CLIError on file verification failure', async () => {
      fs.mkdir.mockResolvedValue();
      fs.access.mockRejectedValue({ code: 'ENOENT' });
      fs.writeFile.mockResolvedValue();
      fs.rename.mockResolvedValue();
      // Return different data for verification failure
      fs.readFile.mockResolvedValue(
        JSON.stringify(
          {
            apps: [],
            lastUpdated: '2025-01-15T10:30:00.000Z',
            totalApps: 0, // Different from expected 2
          },
          null,
          2
        )
      );

      await expect(
        writeAppsJson(mockAppsData, 'test-output.json', mockLogger)
      ).rejects.toThrow(CLIError);
    });

    it('should format JSON with correct structure and indentation', async () => {
      fs.mkdir.mockResolvedValue();
      fs.access.mockRejectedValue({ code: 'ENOENT' });
      fs.writeFile.mockResolvedValue();
      fs.rename.mockResolvedValue();
      fs.readFile.mockResolvedValue('dummy'); // Not used in this test
      fs.stat.mockResolvedValue({ size: 1024 });

      // Capture the JSON data written to file
      let writtenJson;
      fs.writeFile.mockImplementation((_, data) => {
        writtenJson = data;
        return Promise.resolve();
      });

      await writeAppsJson(mockAppsData, 'test-output.json', mockLogger);

      const parsedJson = JSON.parse(writtenJson);
      expect(parsedJson).toEqual({
        apps: mockAppsData,
        lastUpdated: '2025-01-15T10:30:00.000Z',
        totalApps: 2,
      });

      // Check indentation (should be 2 spaces)
      expect(writtenJson).toContain('  "apps"');
      expect(writtenJson).toContain('  "lastUpdated"');
      expect(writtenJson).toContain('  "totalApps"');
    });

    it('should calculate file size correctly', async () => {
      fs.mkdir.mockResolvedValue();
      fs.access.mockRejectedValue({ code: 'ENOENT' });
      fs.writeFile.mockResolvedValue();
      fs.rename.mockResolvedValue();
      fs.readFile.mockResolvedValue(
        JSON.stringify(
          {
            apps: mockAppsData,
            lastUpdated: '2025-01-15T10:30:00.000Z',
            totalApps: 2,
          },
          null,
          2
        )
      );

      // Test different file sizes
      fs.stat.mockResolvedValue({ size: 1536 }); // 1.5 KB

      await writeAppsJson(mockAppsData, 'test-output.json', mockLogger);

      expect(mockLogger.success).toHaveBeenCalledWith(
        'JSON file written successfully: test-output.json (1.5 KB)'
      );
    });
  });
});
