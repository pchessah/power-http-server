const net = require('net');

// Test 1: Completely malformed request
function testMalformed1() {
  console.log('🧪 Test 1: Completely malformed request');
  const client = net.createConnection(8080, 'localhost', () => {
    console.log('Connected to server');
    client.write('INVALID DATA\r\n\r\n');
  });
  
  client.on('data', (data) => {
    console.log('Received:', data.toString());
    client.end();
  });
  
  client.on('end', () => {
    console.log('Connection closed');
  });
}

// Test 2: Incomplete request line
function testMalformed2() {
  console.log('\n🧪 Test 2: Incomplete request line');
  const client = net.createConnection(8080, 'localhost', () => {
    console.log('Connected to server');
    client.write('GET /\r\n\r\n');
  });
  
  client.on('data', (data) => {
    console.log('Received:', data.toString());
    client.end();
  });
  
  client.on('end', () => {
    console.log('Connection closed');
  });
}

// Test 3: Invalid HTTP method
function testMalformed3() {
  console.log('\n🧪 Test 3: Invalid HTTP method');
  const client = net.createConnection(8080, 'localhost', () => {
    console.log('Connected to server');
    client.write('INVALID / HTTP/1.1\r\nHost: localhost:8080\r\n\r\n');
  });
  
  client.on('data', (data) => {
    console.log('Received:', data.toString());
    client.end();
  });
  
  client.on('end', () => {
    console.log('Connection closed');
  });
}

// Test 4: No headers separator
function testMalformed4() {
  console.log('\n🧪 Test 4: No headers separator');
  const client = net.createConnection(8080, 'localhost', () => {
    console.log('Connected to server');
    client.write('GET / HTTP/1.1\r\nHost: localhost:8080\r\nContent-Length: 10\r\nThis is the body');
  });
  
  client.on('data', (data) => {
    console.log('Received:', data.toString());
    client.end();
  });
  
  client.on('end', () => {
    console.log('Connection closed');
  });
}

// Run all tests
setTimeout(testMalformed1, 1000);
setTimeout(testMalformed2, 2000);
setTimeout(testMalformed3, 3000);
setTimeout(testMalformed4, 4000);
