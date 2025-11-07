import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface FaceScanResult {
  success: boolean;
  confidence: number;
  imageData: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class FaceScanService {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;

  constructor() {}

  async initializeCamera(): Promise<boolean> {
    try {
      // Check if we already have a working stream
      if (this.stream && this.stream.active) {
        console.log('Camera stream already active, reusing existing stream');
        return true;
      }
      
      // Stop any existing stream only if it's not active
      if (this.stream) {
        console.log('Stopping inactive stream');
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      
      console.log('Requesting camera access...');
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front camera
        },
        audio: false
      });
      
      console.log('Camera stream obtained successfully:', this.stream);
      console.log('Stream active:', this.stream.active);
      console.log('Video tracks:', this.stream.getVideoTracks());
      
      return true;
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      // Re-throw the error so the component can handle it properly
      throw error;
    }
  }

  startVideoStream(videoElement: HTMLVideoElement): boolean {
    if (!this.stream) {
      console.error('No camera stream available');
      return false;
    }
    
    if (!videoElement) {
      console.error('No video element provided');
      return false;
    }

    try {
      console.log('Starting video stream with element:', videoElement);
      console.log('Stream tracks:', this.stream.getTracks());
      
      this.video = videoElement;
      
      // Set video properties
      videoElement.muted = true;
      videoElement.playsInline = true;
      videoElement.autoplay = true;
      videoElement.controls = false;
      
      // Clear any existing source
      if (videoElement.srcObject) {
        videoElement.srcObject = null;
      }
      
      // Assign the stream
      videoElement.srcObject = this.stream;
      
      console.log('Video element srcObject set:', videoElement.srcObject);
      
      // Try to play
      videoElement.play()
        .then(() => {
          console.log('Video playing successfully');
        })
        .catch(error => {
          console.error('Error playing video:', error);
          // Don't fail here - some browsers don't require explicit play
        });
      
      return true;
    } catch (error) {
      console.error('Error setting up video stream:', error);
      return false;
    }
  }

  captureImage(): string | null {
    if (!this.video) return null;

    // Create canvas to capture image
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    const context = this.canvas.getContext('2d');
    if (!context) return null;

    // Draw current video frame to canvas
    context.drawImage(this.video, 0, 0);

    // Convert to base64 image data
    return this.canvas.toDataURL('image/jpeg', 0.8);
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
  }

  // Mock face recognition - in production, this would call a real AI service
  async performFaceRecognition(imageData: string, userId: number): Promise<FaceScanResult> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock face recognition logic
    // In production, you would send imageData to a face recognition service
    // like AWS Rekognition, Azure Face API, or Google Vision API
    
    const mockConfidence = Math.random() * 100;
    const threshold = 75; // Minimum confidence threshold
    
    return {
      success: mockConfidence >= threshold,
      confidence: Math.round(mockConfidence),
      imageData: imageData,
      message: mockConfidence >= threshold 
        ? `Face verified with ${Math.round(mockConfidence)}% confidence`
        : `Face verification failed. Confidence: ${Math.round(mockConfidence)}%`
    };
  }

  // Check if camera is available
  async isCameraAvailable(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch {
      return false;
    }
  }

  // Method to directly set stream and video element (for fallback initialization)
  setStream(stream: MediaStream, videoElement: HTMLVideoElement): void {
    this.stream = stream;
    this.video = videoElement;
    console.log('Stream and video element set directly');
  }
}