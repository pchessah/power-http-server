/**
 * Type definitions for the HTTP Request Parser
 * 
 * This module contains TypeScript interfaces and types used throughout
 * the HTTP parsing system to ensure type safety and provide clear
 * contracts for HTTP request handling.
 */

/**
 * Supported HTTP methods for request parsing.
 * 
 * This type ensures that only valid HTTP methods are accepted
 * during request parsing and validation.
 */
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';