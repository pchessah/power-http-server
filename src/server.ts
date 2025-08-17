import * as net from 'net';

import { HttpRequestParser } from './httpParser';

/**
 * Simple HTTP Server Implementation
 * 
 * This server demonstrates the HttpRequestParser in action by:
 * - Accepting TCP connections on port 8080
 * - Parsing incoming HTTP requests using HttpRequestParser
 * - Generating appropriate HTTP responses
 * - Handling basic routing (root path vs 404)
 * 
 * The server serves as a practical example of how to use the HttpRequestParser
 * class for building HTTP-based applications.
 */
const server = net.createServer((socket: net.Socket) => {
  let data: Buffer = Buffer.alloc(0);
  const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  
  console.log(`🔌 New connection from ${clientAddress}`);

  socket.on('data', (chunk: Buffer) => {
    data = Buffer.concat([data, chunk]);

    try {
      // Parse the HTTP request using our custom parser
      const parser = HttpRequestParser.parse(data);

      // Extract Content-Length for body validation
      const contentLength = parseInt(parser.getHeader('content-length') || '0', 10);
      const headerIndex = data.indexOf(Buffer.from('\r\n\r\n'));

      // Wait for complete request if headers are incomplete
      if (headerIndex === -1) {
        return;
      }

      // Check if we have received the complete request body
      const expectedLength = headerIndex + 4 + contentLength;
      if (data.length >= expectedLength) {
        // Process the complete request
        let statusCode = 200;
        let responseBody = "Cows will fly!";
        let contentType = "text/plain";

        // Simple routing: root path returns success, others return 404
        if (parser.path !== '/') {
          statusCode = 404;
          responseBody = 'Not Found';
          console.log(`❌ 404 Not Found for path: ${parser.path}`);
        } else {
          console.log(`✅ 200 OK for ${parser.method} ${parser.path}`);
        }

        // Generate and send HTTP response
        const response = parser.generateResponse(statusCode, responseBody, { 'Content-Type': contentType });
        socket.write(response);
        socket.end();
        
        console.log(`📤 Response sent to ${clientAddress} (${statusCode})`);
      }

    } catch (error) {
      // Handle parsing errors and malformed requests
      console.error(`❌ Error parsing request from ${clientAddress}:`, error);
      
      // Send appropriate error response
      let errorMessage = 'Bad Request';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      const response = new HttpRequestParser().generateResponse(400, `Bad Request: ${errorMessage}`, { 
        'Content-Type': 'text/plain',
        'Connection': 'close'
      });
      socket.write(response);
      socket.end();
      console.log(`📤 Error response sent to ${clientAddress}`);
    }

  });

  socket.on('end', () => {
    console.log(`🛑 Client ${clientAddress} disconnected`);
  });

  socket.on('error', (err) => {
    console.error(`⛔ Socket error for ${clientAddress}:`, err);
  });
});

// Start the server
server.listen(8080, () => {
  console.log('🔊 HTTP Server listening on port 8080');
  console.log('📝 Ready to receive HTTP requests!');
  console.log('💡 Try: curl http://localhost:8080/');
  console.log('💡 Try: curl -X POST -d "hello world" http://localhost:8080/');
  console.log('💡 Try: curl http://localhost:8080/nonexistent');
});