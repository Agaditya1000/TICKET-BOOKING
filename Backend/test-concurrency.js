/**
 * Concurrency Test Script
 * 
 * This script demonstrates concurrent booking requests to test
 * the system's ability to prevent overbooking.
 * 
 * Usage: node test-concurrency.js <show_id> <num_requests> <concurrency>
 * Example: node test-concurrency.js abc-123 100 10
 */

const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const showId = process.argv[2];
const numRequests = parseInt(process.argv[3]) || 50;
const concurrency = parseInt(process.argv[4]) || 10;

if (!showId) {
  console.error('Usage: node test-concurrency.js <show_id> [num_requests] [concurrency]');
  process.exit(1);
}

function makeBookingRequest(showId, seatNumbers) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      show_id: showId,
      seat_numbers: seatNumbers
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/bookings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

async function runConcurrencyTest() {
  console.log(`\n🚀 Starting Concurrency Test`);
  console.log(`Show ID: ${showId}`);
  console.log(`Total Requests: ${numRequests}`);
  console.log(`Concurrency: ${concurrency}\n`);

  const results = {
    success: 0,
    failed: 0,
    pending: 0,
    confirmed: 0,
    errors: 0
  };

  const requests = [];
  for (let i = 0; i < numRequests; i++) {
    // Try to book the same seat (seat "1") to test race condition
    requests.push(() => makeBookingRequest(showId, ['1']));
  }

  // Execute requests with limited concurrency
  const executeWithConcurrency = async (tasks, limit) => {
    const results = [];
    const executing = [];

    for (const task of tasks) {
      const promise = task().then(result => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });

      results.push(promise);
      executing.push(promise);

      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }

    return Promise.all(results);
  };

  const startTime = Date.now();
  const responses = await executeWithConcurrency(requests, concurrency);
  const endTime = Date.now();

  responses.forEach(response => {
    if (response.status === 201) {
      results.success++;
      if (response.data.status === 'PENDING') {
        results.pending++;
      } else if (response.data.status === 'CONFIRMED') {
        results.confirmed++;
      }
    } else if (response.status === 400) {
      results.failed++;
    } else {
      results.errors++;
    }
  });

  console.log('\n📊 Test Results:');
  console.log('─'.repeat(50));
  console.log(`Total Requests:     ${numRequests}`);
  console.log(`Successful (201):   ${results.success}`);
  console.log(`Failed (400):       ${results.failed}`);
  console.log(`Errors:             ${results.errors}`);
  console.log(`Pending Bookings:   ${results.pending}`);
  console.log(`Confirmed Bookings: ${results.confirmed}`);
  console.log(`Duration:           ${endTime - startTime}ms`);
  console.log(`Requests/sec:       ${(numRequests / ((endTime - startTime) / 1000)).toFixed(2)}`);
  console.log('─'.repeat(50));
  console.log('\n✅ Test completed!');
  console.log('💡 Note: Only one booking should succeed for seat "1"');
  console.log('   Other requests should fail with "Seat already booked" or "Seat is held"\n');
}

runConcurrencyTest().catch(console.error);

