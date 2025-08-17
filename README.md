# Power HTTP Server

A lightweight HTTP server implementation that parses HTTP requests from scratch without external libraries. Built in TypeScript with comprehensive documentation and type safety.

## 🚀 Features

- **Raw HTTP Parsing**: Parses HTTP requests from scratch without external dependencies
- **Complete Request Analysis**: Extracts method, path, version, headers, and body
- **Content-Length Handling**: Properly handles body extraction based on Content-Length headers
- **Response Generation**: Creates valid HTTP responses with proper formatting
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Error Handling**: Robust error handling for malformed requests
- **Binary Support**: Handles both text and binary request bodies

## 📋 Requirements

- Node.js 16+ 
- TypeScript 5.0+

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd power-http-server

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## 🎯 Usage

### Starting the Server

```bash
npm start
```

The server will start on port 8080 and display available test commands.

### Testing with curl

```bash
# Basic GET request
curl http://localhost:8080/

# POST request with data
curl -X POST -d "hello world" http://localhost:8080/

# POST request with JSON
curl -X POST -H "Content-Type: application/json" -d '{"test": "data"}' http://localhost:8080/

# Test 404 response
curl http://localhost:8080/nonexistent
```

### Using the HttpRequestParser

```typescript
import { HttpRequestParser } from './src/httpParser';

// Parse a raw HTTP request
const rawRequest = 'GET /api/users HTTP/1.1\r\nHost: example.com\r\n\r\n';
const parser = HttpRequestParser.parse(rawRequest);

// Access parsed data
console.log(parser.method);        // 'GET'
console.log(parser.path);          // '/api/users'
console.log(parser.httpVersion);   // 'HTTP/1.1'
console.log(parser.headers);       // { host: 'example.com' }
console.log(parser.getHeader('host')); // 'example.com'

// Generate a response
const response = parser.generateResponse(200, 'Success', {
  'Content-Type': 'application/json'
});
```

## 🏗️ Architecture

### Core Components

1. **HttpRequestParser**: Main class for parsing HTTP requests and generating responses
2. **Server**: Simple TCP server that demonstrates the parser in action
3. **Interfaces**: TypeScript type definitions for type safety

### HTTP Parsing Flow

1. **Input Validation**: Accepts string or Buffer input
2. **Header Separation**: Locates `\r\n\r\n` separator between headers and body
3. **Request Line Parsing**: Extracts method, path, and HTTP version
4. **Header Extraction**: Parses key-value pairs with case-insensitive keys
5. **Body Extraction**: Uses Content-Length header or falls back to size limits
6. **Type Conversion**: Converts body to appropriate type based on content-type

### Supported HTTP Features

- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- **Headers**: All standard HTTP headers with case-insensitive lookup
- **Body Handling**: Text and binary content with proper encoding
- **Content-Length**: Exact body size determination when specified
- **Fallback Limits**: 8KB default body size when Content-Length is absent

## 📚 API Reference

### HttpRequestParser Class

#### Static Methods

##### `parse(input: string | Buffer): HttpRequestParser`

Parses raw HTTP request data into a structured parser instance.

**Parameters:**
- `input`: Raw HTTP request as string or Buffer

**Returns:** Populated HttpRequestParser instance

**Throws:** Error when request format is invalid

#### Instance Properties

- `method: RequestMethod` - HTTP method (GET, POST, etc.)
- `path: string` - Request path
- `httpVersion: string` - HTTP version
- `headers: Record<string, string>` - All request headers
- `body: string | Buffer` - Request body content
- `isTruncated: boolean` - Indicates if body was truncated

#### Instance Methods

##### `getHeader(key: string): string | undefined`

Gets a specific header value by key (case-insensitive).

**Parameters:**
- `key`: Header key to look up

**Returns:** Header value or undefined if not found

##### `generateResponse(statusCode: number, body: string | Buffer, customHeaders?: Record<string, string>): Buffer`

Generates a valid HTTP response with proper headers and formatting.

**Parameters:**
- `statusCode`: HTTP status code
- `body`: Response body content
- `customHeaders`: Optional additional headers

**Returns:** Buffer containing complete HTTP response

## 🔧 Configuration

### Body Size Limits

The parser uses a default maximum body size of 8KB when Content-Length is not specified. This can be modified in the `HttpRequestParser` class:

```typescript
private readonly MAX_BODY_SIZE = 8192; // 8KB default
```

### Supported HTTP Methods

The parser validates HTTP methods against a predefined list. To add support for additional methods, modify the validation in the `parse` method:

```typescript
if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(parser._method)) {
  throw new Error(`Unsupported HTTP method: ${parser._method}`);
}
```

## 🧪 Testing

### Manual Testing

Use the provided curl commands to test different scenarios:

```bash
# Test basic functionality
curl http://localhost:8080/

# Test POST with data
curl -X POST -d "test data" http://localhost:8080/

# Test error handling
curl -d "malformed" http://localhost:8080/
```

### Automated Testing

For automated testing of malformed requests, use the provided test script:

```bash
node test-malformed.js
```

This script tests various edge cases including:
- Completely malformed requests
- Incomplete request lines
- Invalid HTTP methods
- Missing header separators

## 🚨 Error Handling

The parser handles various error conditions:

- **Invalid Request Format**: Missing headers or malformed request lines
- **Unsupported Features**: Chunked transfer encoding
- **Invalid Content-Length**: Non-numeric or negative values
- **Incomplete Bodies**: Body shorter than specified Content-Length
- **Unsupported Methods**: HTTP methods not in the supported list

All errors result in appropriate HTTP error responses (typically 400 Bad Request).

## 📖 Technical Details

### HTTP Compliance

The implementation follows HTTP/1.1 specifications for:
- Request line format: `METHOD /path HTTP/version`
- Header format: `Key: Value` with case-insensitive keys
- Body separation: `\r\n\r\n` (CRLF CRLF)
- Content-Length header handling

### Performance Considerations

- **Memory Efficient**: Uses Buffer slicing for body extraction
- **Type Preservation**: Maintains original data types (string/Buffer)
- **Minimal Allocations**: Reuses buffers where possible
- **Fast Parsing**: Linear time complexity for request parsing

### Security Features

- **Input Validation**: Validates all parsed components
- **Size Limits**: Prevents memory exhaustion with body size limits
- **Type Safety**: TypeScript prevents many runtime errors
- **Error Isolation**: Malformed requests don't crash the server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper documentation
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Built for educational purposes to understand HTTP protocol implementation
- No external HTTP parsing libraries used
- Focuses on clean, readable, and well-documented code
