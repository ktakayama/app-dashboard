/**
 * Logger utility for CLI application
 */

export class Logger {
  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message, ...args) {
    console.log(`[INFO] ${message}`, ...args);
  }

  verbose(message, ...args) {
    if (this.verbose) {
      console.log(`[VERBOSE] ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message, ...args) {
    console.error(`[ERROR] ${message}`, ...args);
  }

  success(message, ...args) {
    console.log(`[SUCCESS] ${message}`, ...args);
  }
}

export function createLogger(verbose = false) {
  return new Logger(verbose);
}