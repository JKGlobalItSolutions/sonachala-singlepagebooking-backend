const nodemailer = require('nodemailer');

// Create SMTP transporter
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // use TLS
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// HTML table styles
const tableStyles = `
    <style>
        .booking-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .booking-table th, .booking-table td {
            padding: 12px;
            border: 1px solid #ddd;
        }
        .booking-table th {
            background-color: #f8f9fa;
            text-align: left;
        }
        .email-container {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 30px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
        }
    </style>
`;

// Generate HTML table for booking details
const generateBookingTable = (booking) => `
    <table class="booking-table">
        <tr>
            <th>Confirmation ID</th>
            <td>${booking.confirmationId || booking.bookingId || booking._id}</td>
        </tr>
        <tr>
            <th>Guest Name</th>
            <td>${booking.guestDetails.firstName} ${booking.guestDetails.lastName}</td>
        </tr>
        <tr>
            <th>Check-in Date</th>
            <td>${new Date(booking.bookingDetails.checkIn).toLocaleDateString()}</td>
        </tr>
        <tr>
            <th>Check-out Date</th>
            <td>${new Date(booking.bookingDetails.checkOut).toLocaleDateString()}</td>
        </tr>
        <tr>
            <th>Room Type</th>
            <td>${booking.roomDetails.roomType}</td>
        </tr>
        <tr>
            <th>Number of Rooms</th>
            <td>${booking.bookingDetails.numberOfRooms}</td>
        </tr>
        <tr>
            <th>Number of Guests</th>
            <td>Adults: ${booking.bookingDetails.numberOfAdults}, Children: ${booking.bookingDetails.numberOfChildren}</td>
        </tr>
        <tr>
            <th>Total Amount</th>
            <td>₹${booking.amountDetails.grandTotal}</td>
        </tr>
    </table>
`;

// Send confirmation email to guest
const sendGuestConfirmationEmail = async (booking) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: booking.guestDetails.email,
            subject: 'Your Hotel Booking is Confirmed',
            html: `
                ${tableStyles}
                <div class="email-container">
                    <div class="header">
                        <h1>Booking Confirmation</h1>
                    </div>
                    
                    <p>Dear ${booking.guestDetails.firstName} ${booking.guestDetails.lastName},</p>
                    <p>Thank you for choosing our hotel. Your booking has been confirmed!</p>
                    
                    <h2>Booking Details:</h2>
                    ${generateBookingTable(booking)}
                    
                    <p>We look forward to welcoming you!</p>
                    
                    <div class="footer">
                        <p>If you have any questions, please don't hesitate to contact us.</p>
                        <small>This is an automated email. Please do not reply.</small>
                    </div>
                </div>
            `,
            text: `
                Booking Confirmation
                
                Dear ${booking.guestDetails.firstName} ${booking.guestDetails.lastName},
                
                Thank you for choosing our hotel. Your booking has been confirmed!
                
                Booking Details:
                Check-in: ${new Date(booking.bookingDetails.checkIn).toLocaleDateString()}
                Check-out: ${new Date(booking.bookingDetails.checkOut).toLocaleDateString()}
                Room Type: ${booking.roomDetails.roomType}
                Total Amount: ₹${booking.amountDetails.grandTotal}
                
                We look forward to welcoming you!
                
                If you have any questions, please don't hesitate to contact us.
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Guest confirmation email sent successfully');
    } catch (error) {
        console.error('Error sending guest confirmation email:', error);
        throw error;
    }
};

// Send notification email to admin
const sendAdminNotificationEmail = async (booking, adminEmail) => {

    console.log(adminEmail);
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: adminEmail || process.env.EMAIL_USER, // Use admin email if provided, fallback to sender
            subject: 'New Booking Received',
            html: `
                ${tableStyles}
                <div class="email-container">
                    <div class="header">
                        <h1>New Booking Notification</h1>
                    </div>
                    
                    <p>A new booking has been received with the following details:</p>
                    
                    ${generateBookingTable(booking)}
                    
                    <div class="footer">
                        <p>Please check the admin dashboard for more details.</p>
                        <small>This is an automated email. Please do not reply.</small>
                    </div>
                </div>
            `,
            text: `
                New Booking Notification
                
                A new booking has been received:
                
                Guest: ${booking.guestDetails.firstName} ${booking.guestDetails.lastName}
                Email: ${booking.guestDetails.email}
                Phone: ${booking.guestDetails.phone}
                Check-in: ${new Date(booking.bookingDetails.checkIn).toLocaleDateString()}
                Check-out: ${new Date(booking.bookingDetails.checkOut).toLocaleDateString()}
                Room Type: ${booking.roomDetails.roomType}
                Total Amount: ₹${booking.amountDetails.grandTotal}
                
                Please check the admin dashboard for more details.
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Admin notification email sent successfully to:', adminEmail || process.env.EMAIL_USER);
    } catch (error) {
        console.error('Error sending admin notification email:', error);
        console.error('Admin email was:', adminEmail);
        console.error('Fallback email:', process.env.EMAIL_USER);
        throw error;
    }
};

module.exports = {
    sendGuestConfirmationEmail,
    sendAdminNotificationEmail
};
