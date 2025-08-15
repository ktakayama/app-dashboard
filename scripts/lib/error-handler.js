/**
 * Error handling utilities for CLI application
 */

export class CLIError extends Error {
  constructor(message, code = 1) {
    super(message);
    this.name = 'CLIError';
    this.code = code;
  }
}

export function handleError(error, logger) {
  if (error instanceof CLIError) {
    logger.error(error.message);
    process.exit(error.code);
  } else if (error instanceof Error) {
    logger.error(`Unexpected error: ${error.message}`);
    if (logger.verbose) {
      logger.error(error.stack);
    }
    process.exit(1);
  } else {
    logger.error(`Unknown error: ${error}`);
    process.exit(1);
  }
}

export function setupGlobalErrorHandlers(logger) {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error.message);
    if (logger.verbose) {
      logger.error(error.stack);
    }
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}
