// Simple test to verify booking endpoint
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testBooking() {
  try {
    const formData = new FormData();
    
    // Test data
    formData.append('guestDetails', JSON.stringify({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      city: 'New York',
      country: 'US'
    }));

    formData.append('roomDetails', JSON.stringify({
      roomId: '507f1f77bcf86cd799439011', // Sample ObjectId
      roomType: 'Deluxe Room',
      pricePerNight: 150,
      maxGuests: 2,
      bedType: 'King Bed',
      roomSize: '35 sq m'
    }));

    formData.append('bookingDetails', JSON.stringify({
      checkIn: '2024-02-01',
      checkOut: '2024-02-03',
      numberOfRooms: 1,
      numberOfAdults: 2,
      numberOfChildren: 0,
      numberOfNights: 2,
      hotelId: '507f1f77bcf86cd799439012' // Sample ObjectId
    }));

    formData.append('amountDetails', JSON.stringify({
      roomCharges: 300,
      taxesAndFees: 54,
      discount: 0,
      grandTotal: 354,
      currency: 'INR'
    }));

    formData.append('paymentDetails', JSON.stringify({
      paymentMethod: 'UPI',
      paymentStatus: 'pending',
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentDate: new Date().toISOString()
    }));

    formData.append('bookingMetadata', JSON.stringify({
      bookingDate: new Date().toISOString(),
      bookingSource: 'web',
      userAgent: 'Test Agent',
      ipAddress: '127.0.0.1'
    }));

    const response = await axios.post('http://localhost:5000/bookings', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 10000,
    });

    console.log('✅ Booking created successfully!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Error creating booking:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testBooking();
}

module.exports = testBooking;
