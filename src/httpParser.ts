import { RequestMethod } from "./interfaces";

/**
 * HTTP Request Parser - Parses raw HTTP requests from scratch without external libraries.
 * 
 * This class implements a complete HTTP request parser that handles:
 * - HTTP method validation (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
 * - Request line parsing (METHOD /path HTTP/version)
 * - Header parsing with case-insensitive key lookup
 * - Body extraction based on Content-Length header
 * - Response generation with proper HTTP formatting
 * 
 * Key Features:
 * - Handles both string and Buffer inputs
 * - Supports binary and text body content
 * - Implements Content-Length based body extraction
 * - Provides fallback body size limits (8KB default)
 * - Generates valid HTTP responses with proper headers
 * 
 * HTTP Parsing Rules:
 * 1. Request must start with valid HTTP method followed by path and version
 * 2. Headers are separated from body by \r\n\r\n (CRLF CRLF)
 * 3. Header keys are case-insensitive per HTTP spec
 * 4. Content-Length header determines exact body size when present
 * 5. Body is truncated to MAX_BODY_SIZE when Content-Length is absent
 * 6. Chunked transfer encoding is not supported
 * 
 * @example
 * ```typescript
 * const parser = HttpRequestParser.parse(rawRequestData);
 * console.log(parser.method); // 'GET'
 * console.log(parser.path); // '/api/users'
 * console.log(parser.getHeader('content-type')); // 'application/json'
 * 
 * const response = parser.generateResponse(200, 'Success', {
 *   'Content-Type': 'application/json'
 * });
 * ```
 */
export class HttpRequestParser {
  private _method: RequestMethod;
  private _path: string;
  private _isTruncated: boolean;
  private _httpVersion: string;
  private _headers: Record<string, string>;
  private _body: string | Buffer;
  
  /** Maximum body size when Content-Length is not specified (8KB) */
  private readonly MAX_BODY_SIZE = 8192;
  
  /** Standard HTTP status messages for response generation */
  private readonly statusMessages: Record<number, string> = {
    200: 'OK',
    400: 'Bad Request',
    404: 'Not Found',
    500: 'Internal Server Error',
  };

  /**
   * Constructor: Initializes default values.
   * Note: Parsing happens in static parse() method to separate concerns.
   */
  constructor() {
    this._method = '' as RequestMethod;
    this._path = '';
    this._httpVersion = '';
    this._headers = {};
    this._body = '';
    this._isTruncated = false;
  }

  /**
   * Parses raw HTTP request data into a structured HttpRequestParser instance.
   * 
   * This method implements the core HTTP parsing logic:
   * 1. Converts input to string for header parsing
   * 2. Locates header/body separator (\r\n\r\n)
   * 3. Parses request line (METHOD /path HTTP/version)
   * 4. Extracts and normalizes headers
   * 5. Determines body size from Content-Length or uses fallback
   * 6. Extracts body content with proper type handling
   * 
   * @param input - Raw HTTP request as string or Buffer
   * @returns Populated HttpRequestParser instance with parsed request data
   * @throws {Error} When request format is invalid or unsupported features are detected
   * 
   * @example
   * ```typescript
   * const rawRequest = 'GET /api/users HTTP/1.1\r\nHost: example.com\r\n\r\n';
   * const parser = HttpRequestParser.parse(rawRequest);
   * ```
   */
  static parse(input: string | Buffer): HttpRequestParser {
    const parser = new HttpRequestParser();
    
    // Convert Buffer to string for header parsing (UTF-8 encoding)
    let requestString = typeof input === 'string' ? input : input.toString('utf-8');
    
    // Find separator between headers and body (HTTP spec: \r\n\r\n)
    const headerIndex = requestString.indexOf('\r\n\r\n');
    if (headerIndex === -1) {
      throw new Error('Invalid HTTP Request: No headers found');
    }

    // Extract and parse header section
    const headerSection = requestString.substring(0, headerIndex);
    const lines = headerSection.split('\r\n');

    // Parse request line (first line: METHOD PATH HTTP/VERSION)
    if (lines.length < 1) throw new Error('Invalid request: No request line');
    const requestLineParts = lines[0].split(' ');
    if (requestLineParts.length !== 3) throw new Error('Invalid request line');
    
    parser._method = requestLineParts[0] as RequestMethod;
    // Validate HTTP method against supported types
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(parser._method)) {
      throw new Error(`Unsupported HTTP method: ${parser._method}`);
    }
    parser._path = requestLineParts[1];
    parser._httpVersion = requestLineParts[2];

    // Parse headers: Key: Value format, case-insensitive keys
    parser._headers = lines.slice(1).reduce((acc, line) => {
      if (!line.trim()) return acc; // Skip empty lines
      const [key, ...valueParts] = line.split(':'); // Handle values containing colons
      const value = valueParts.join(':').trim();
      if (key) acc[key.toLowerCase().trim()] = value; // Normalize to lowercase
      return acc;
    }, {} as Record<string, string>);

    // Check for unsupported features
    if (parser._headers['transfer-encoding'] === 'chunked') {
      throw new Error('Chunked encoding not supported');
    }

    // Handle body extraction based on Content-Length header
    const contentLengthStr = parser._headers['content-length'];
    const contentLength = contentLengthStr ? parseInt(contentLengthStr, 10) : undefined;
    if (contentLength !== undefined && isNaN(contentLength)) {
      throw new Error('Invalid Content-Length header');
    }
    
    const bodyStart = headerIndex + 4; // After \r\n\r\n
    const effectiveLength = contentLength ?? parser.MAX_BODY_SIZE;
    
    // Extract body preserving original type (Buffer or string)
    if (Buffer.isBuffer(input)) {
      parser._body = input.slice(bodyStart, bodyStart + effectiveLength);
    } else {
      parser._body = requestString.substring(bodyStart, bodyStart + effectiveLength);
    }
    
    // Set truncation flag if data exceeds effective length
    const inputLength = Buffer.isBuffer(input) ? input.length : requestString.length;
    parser._isTruncated = inputLength > bodyStart + effectiveLength;
    
    // Validate body completeness when Content-Length is specified
    const bodyLength = parser._body.length;
    if (contentLength !== undefined && bodyLength < contentLength) {
      throw new Error('Incomplete body based on Content-Length');
    }

    // Convert body to string for text content types
    const contentType = parser._headers['content-type'] || '';
    if (Buffer.isBuffer(parser._body) && (contentType.startsWith('text/') || contentType.includes('json'))) {
      parser._body = parser._body.toString('utf-8');
    }

    return parser;
  }

  /**
   * Gets the HTTP method of the request.
   * @returns The HTTP method (GET, POST, PUT, DELETE, etc.)
   */
  get method(): RequestMethod {
    return this._method;
  }

  /**
   * Gets the request path.
   * @returns The request path (e.g., '/api/users')
   */
  get path(): string {
    return this._path;
  }

  /**
   * Gets the HTTP version.
   * @returns The HTTP version (e.g., 'HTTP/1.1')
   */
  get httpVersion(): string {
    return this._httpVersion;
  }

  /**
   * Gets all request headers as a copy to prevent mutation.
   * @returns Object containing all headers with lowercase keys
   */
  get headers(): Record<string, string> {
    return { ...this._headers };
  }

  /**
   * Gets a specific header value by key (case-insensitive lookup).
   * @param key - Header key to look up (e.g., 'content-type', 'Content-Type', 'CONTENT-TYPE')
   * @returns Header value or undefined if not found
   * 
   * @example
   * ```typescript
   * const contentType = parser.getHeader('content-type');
   * const userAgent = parser.getHeader('user-agent');
   * ```
   */
  getHeader(key: string): string | undefined {
    return this._headers[key.toLowerCase()];
  }

  /**
   * Gets the request body content.
   * @returns Body as string or Buffer depending on content type
   */
  get body(): string | Buffer {
    return this._body;
  }

  /**
   * Indicates if the request body was truncated due to size limits.
   * @returns true if body was truncated, false otherwise
   */
  get isTruncated(): boolean {
    return this._isTruncated;
  }

  /**
   * Generates a valid HTTP response with proper headers and formatting.
   * 
   * This method creates a complete HTTP response including:
   * - Status line with code and message
   * - Required headers (Content-Length, Content-Type)
   * - Custom headers provided by the caller
   * - Response body with proper encoding
   * 
   * @param statusCode - HTTP status code (e.g., 200, 404, 500)
   * @param body - Response body content (string or Buffer)
   * @param customHeaders - Optional additional headers to include
   * @returns Buffer containing the complete HTTP response ready for transmission
   * 
   * @example
   * ```typescript
   * const response = parser.generateResponse(200, 'Success', {
   *   'Content-Type': 'application/json',
   *   'Cache-Control': 'no-cache'
   * });
   * socket.write(response);
   * ```
   */
  generateResponse(statusCode: number, body: string | Buffer, customHeaders: Record<string, string> = {}): Buffer {
    const bodyBuf = typeof body === 'string' ? Buffer.from(body, 'utf-8') : body;
    
    // Build headers with defaults and custom overrides
    const headers = {
      'Content-Length': bodyBuf.length.toString(),
      'Content-Type': 'text/plain', // Default content type
      ...customHeaders,
    };

    // Construct status line
    let headerStr = `HTTP/1.1 ${statusCode} ${this.statusMessages[statusCode] || 'OK'}\r\n`;
    
    // Add all headers
    Object.entries(headers).forEach(([key, value]) => {
      headerStr += `${key}: ${value}\r\n`;
    });
    headerStr += '\r\n'; // End headers

    // Combine headers and body into single Buffer
    return Buffer.concat([Buffer.from(headerStr, 'utf-8'), bodyBuf]);
  }
}