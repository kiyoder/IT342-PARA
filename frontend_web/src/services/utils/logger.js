// Logger utility for consistent logging across the app

// Log levels
export const LOG_LEVELS = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
};

// Function to generate a timestamp
const getTimestamp = () => new Date().toISOString();

// Main logging function
export const log = (level, context, message, data = null) => {
  const logEntry = {
    timestamp: getTimestamp(),
    level,
    context,
    message,
    ...(data && { data }),
  };

  // Log to console with appropriate method
  switch (level) {
    case LOG_LEVELS.ERROR:
      console.error(
        `[${logEntry.timestamp}] [${level}] [${context}] ${message}`,
        data || ""
      );
      break;
    case LOG_LEVELS.WARN:
      console.warn(
        `[${logEntry.timestamp}] [${level}] [${context}] ${message}`,
        data || ""
      );
      break;
    case LOG_LEVELS.INFO:
      console.info(
        `[${logEntry.timestamp}] [${level}] [${context}] ${message}`,
        data || ""
      );
      break;
    case LOG_LEVELS.DEBUG:
    default:
      console.log(
        `[${logEntry.timestamp}] [${level}] [${context}] ${message}`,
        data || ""
      );
  }

  return logEntry;
};

// Convenience methods
export const debug = (context, message, data) =>
  log(LOG_LEVELS.DEBUG, context, message, data);
export const info = (context, message, data) =>
  log(LOG_LEVELS.INFO, context, message, data);
export const warn = (context, message, data) =>
  log(LOG_LEVELS.WARN, context, message, data);
export const error = (context, message, data) =>
  log(LOG_LEVELS.ERROR, context, message, data);
