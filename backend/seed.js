/**
 * Seed Script — SafeGuard Women Safety System
 * Run: node seed.js
 * Creates demo user, admin, emergency contacts, and sample alerts.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const EmergencyContact = require('./models/EmergencyContact');
const Alert = require('./models/Alert');
const Message = require('./models/Message');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/womensafety';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      EmergencyContact.deleteMany({}),
      Alert.deleteMany({}),
      Message.deleteMany({}),
    ]);
    console.log('🗑  Cleared existing data');

    // ── Create Admin ──────────────────────────────────────────────────────────
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@safeguard.com',
      password: 'admin123',
      phone: '+91 9000000001',
      role: 'admin',
      safetyStatus: 'safe',
    });
    console.log('👑 Admin created:', admin.email);

    // ── Create Demo User ──────────────────────────────────────────────────────
    const demoUser = await User.create({
      name: 'Priya Sharma',
      email: 'demo@safeguard.com',
      password: 'demo123',
      phone: '+91 9876543210',
      role: 'user',
      address: '45 Sector 18, Noida, UP',
      safetyStatus: 'safe',
      lastLocation: { lat: 28.5355, lng: 77.3910, updatedAt: new Date() },
    });
    console.log('👤 Demo user created:', demoUser.email);

    // ── Create Emergency Contacts ─────────────────────────────────────────────
    const contact1 = await EmergencyContact.create({
      user: demoUser._id,
      name: 'Anita Sharma',
      phone: '+91 9876543211',
      email: 'anita@example.com',
      relationship: 'mother',
      isPrimary: true,
      isNotified: true,
    });

    const contact2 = await EmergencyContact.create({
      user: demoUser._id,
      name: 'Rahul Sharma',
      phone: '+91 9876543212',
      email: 'rahul@example.com',
      relationship: 'brother',
      isPrimary: false,
      isNotified: true,
    });

    const contact3 = await EmergencyContact.create({
      user: demoUser._id,
      name: 'Sneha Gupta',
      phone: '+91 9876543213',
      email: 'sneha@example.com',
      relationship: 'friend',
      isPrimary: false,
      isNotified: true,
    });

    // Link contacts to user
    await User.findByIdAndUpdate(demoUser._id, {
      emergencyContacts: [contact1._id, contact2._id, contact3._id],
    });
    console.log('👥 Emergency contacts created (3)');

    // ── Create Sample Alerts ──────────────────────────────────────────────────
    const alert1 = await Alert.create({
      user: demoUser._id,
      type: 'sos',
      status: 'resolved',
      location: { lat: 28.5355, lng: 77.3910, address: 'Sector 18, Noida, UP' },
      message: 'Being followed by unknown person near metro station!',
      notifiedContacts: [
        { contact: contact1._id, name: 'Anita Sharma', phone: '+91 9876543211', method: 'mock' },
        { contact: contact2._id, name: 'Rahul Sharma', phone: '+91 9876543212', method: 'mock' },
      ],
      resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      locationHistory: [
        { lat: 28.5355, lng: 77.3910, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) },
        { lat: 28.5360, lng: 77.3915, timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000) },
      ],
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    });

    await Alert.create({
      user: demoUser._id,
      type: 'sos',
      status: 'false-alarm',
      location: { lat: 28.6139, lng: 77.2090, address: 'Connaught Place, New Delhi' },
      message: 'Emergency! I need help immediately!',
      notifiedContacts: [
        { contact: contact1._id, name: 'Anita Sharma', phone: '+91 9876543211', method: 'mock' },
      ],
      resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });

    await Alert.create({
      user: demoUser._id,
      type: 'sos',
      status: 'resolved',
      location: { lat: 28.4595, lng: 77.0266, address: 'Gurugram, Haryana' },
      message: 'Car broke down on highway, feeling unsafe. Please help!',
      notifiedContacts: [
        { contact: contact1._id, name: 'Anita Sharma', phone: '+91 9876543211', method: 'mock' },
        { contact: contact2._id, name: 'Rahul Sharma', phone: '+91 9876543212', method: 'mock' },
        { contact: contact3._id, name: 'Sneha Gupta', phone: '+91 9876543213', method: 'mock' },
      ],
      resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000),
    });

    console.log('🚨 Sample alerts created (3)');

    // ── Create Sample Chat Messages ───────────────────────────────────────────
    const roomId = [demoUser._id.toString(), admin._id.toString()].sort().join('_');

    await Message.create([
      {
        sender: admin._id,
        receiver: demoUser._id,
        room: roomId,
        content: 'Hi Priya, this is the SafeGuard admin. Your account is set up and ready.',
        type: 'text',
        isRead: true,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        sender: demoUser._id,
        receiver: admin._id,
        room: roomId,
        content: 'Thank you! The app looks great. How do I add more contacts?',
        type: 'text',
        isRead: true,
        createdAt: new Date(Date.now() - 55 * 60 * 1000),
      },
      {
        sender: admin._id,
        receiver: demoUser._id,
        room: roomId,
        content: 'Go to the Contacts page from the sidebar. You can add up to 5 trusted people.',
        type: 'text',
        isRead: false,
        createdAt: new Date(Date.now() - 50 * 60 * 1000),
      },
    ]);
    console.log('💬 Sample chat messages created');

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n🎉 Seed complete! Login credentials:');
    console.log('─────────────────────────────────────────');
    console.log('  Demo User : demo@safeguard.com  / demo123');
    console.log('  Admin     : admin@safeguard.com / admin123');
    console.log('─────────────────────────────────────────');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
