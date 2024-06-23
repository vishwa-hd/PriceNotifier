import mongoose from 'mongoose';

let isConnected = false; // variable to track the connection status

export const connectToDB = async () => {
  mongoose.set('strictQuery', true);

  if (!process.env.MONGODB_URI) return console.log('MONGODB_URI is not defined');
  if (isConnected) return console.log('=> using existing database connection');

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
     
      serverSelectionTimeoutMS: 3000, // Increase timeout to 30 seconds
    });

    isConnected = true;
    console.log('MongoDB Connected');
  } catch (error) {
    console.log(error);
  }
};
