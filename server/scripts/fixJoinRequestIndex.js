const mongoose = require('mongoose');
require('dotenv').config();

async function fixJoinRequestIndex() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not defined');
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Drop the old index
    await mongoose.connection.db.collection('joinrequests').dropIndex('user_1_community_1_status_1');
    console.log('Dropped old index: user_1_community_1_status_1');
    
    // Create the new index with partial filter expression
    await mongoose.connection.db.collection('joinrequests').createIndex(
      { user: 1, community: 1 },
      { 
        unique: true,
        partialFilterExpression: { status: 'pending' }
      }
    );
    console.log('Created new index with partial filter expression');
    
    // Create additional indexes for efficient querying
    await mongoose.connection.db.collection('joinrequests').createIndex(
      { community: 1, status: 1 }
    );
    console.log('Created index for community and status');
    
    await mongoose.connection.db.collection('joinrequests').createIndex(
      { user: 1, status: 1 }
    );
    console.log('Created index for user and status');
    
    console.log('All indexes have been updated successfully');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing join request index:', error);
    process.exit(1);
  }
}

fixJoinRequestIndex(); 