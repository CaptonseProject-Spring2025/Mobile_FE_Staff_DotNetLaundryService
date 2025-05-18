import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import useAuthStore from '../store/authStore';

class TrackingService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.callbacks = {
      onLocationReceived: null,
      onError: null,
    };
  }

  async startConnection(orderId) {
    try {
      if (this.connection) {
        await this.stopConnection();
      }

      // Get auth token
      const token = useAuthStore.getState().token;
      if (!token) {
        throw new Error("No authentication token available");
      }

      // Build connection with auth token
      this.connection = new HubConnectionBuilder()
        .withUrl("https://laundry.vuhai.me/trackingHub", {
          accessTokenFactory: () => token
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

      // Set up handlers
      this.connection.on("ReceiveLocation", (lat, lng) => {
        if (this.callbacks.onLocationReceived) {
          this.callbacks.onLocationReceived(lat, lng);
        }
      });

      this.connection.on("ReceiveError", (error) => {
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
        console.error("Tracking hub error:", error);
      });

      // Start connection
      await this.connection.start();
      this.isConnected = true;
      
      // Join order group after connection is established
      await this.connection.invoke("JoinOrder", orderId);
      
      console.log("Connected to tracking hub successfully");
      return true;
    } catch (error) {
      console.error("Error connecting to tracking hub:", error);
      this.isConnected = false;
      if (this.callbacks.onError) {
        this.callbacks.onError("Failed to connect to tracking service");
      }
      return false;
    }
  }

  async stopConnection() {
    if (this.connection) {
      try {
        await this.connection.stop();
        this.isConnected = false;
        console.log("Disconnected from tracking hub");
      } catch (error) {
        console.error("Error stopping tracking hub connection:", error);
      }
      this.connection = null;
    }
  }

  async sendLocation(lat, lng) {
    if (!this.connection || !this.isConnected) {
      console.error("Cannot send location: Not connected to tracking hub");
      return false;
    }

    try {
      await this.connection.invoke("SendLocation", lat, lng);
      return true;
    } catch (error) {
      console.error("Error sending location:", error);
      return false;
    }
  }

  onLocationReceived(callback) {
    this.callbacks.onLocationReceived = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }
  
  // Add methods to remove listeners
  removeLocationListener(callback) {
    if (this.callbacks.onLocationReceived === callback) {
      this.callbacks.onLocationReceived = null;
    }
  }
  
  removeErrorListener(callback) {
    if (this.callbacks.onError === callback) {
      this.callbacks.onError = null;
    }
  }
}

export default new TrackingService();