import { Component, OnInit, OnDestroy, OnChanges, AfterViewChecked, ViewChild, ElementRef, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaceScanService, FaceScanResult } from '../../services/face-scan.service';

@Component({
  selector: 'app-face-scan-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './face-scan-modal.component.html',
  styleUrls: ['./face-scan-modal.component.scss']
})
export class FaceScanModalComponent implements OnInit, OnDestroy, OnChanges, AfterViewChecked {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @Input() isOpen = false;
  @Input() userId: number = 0;
  @Output() scanComplete = new EventEmitter<FaceScanResult>();
  @Output() closeModal = new EventEmitter<void>();

  cameraInitialized = false;
  scanning = false;
  scanResult: FaceScanResult | null = null;
  countdown = 0;
  countdownInterval: any;
  error = '';
  capturedImage: string | null = null;
  private initializationPending = false;

  constructor(
    private faceScanService: FaceScanService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.isOpen) {
      this.initializeCamera();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  ngOnChanges(): void {
    if (this.isOpen && !this.cameraInitialized && !this.initializationPending) {
      // Reset state when opening
      this.capturedImage = null;
      this.scanResult = null;
      this.error = '';
      this.initializationPending = true;
      
      // Mark for initialization - will be handled in ngAfterViewChecked
      console.log('Modal opened, marking for camera initialization');
    } else if (!this.isOpen && this.cameraInitialized) {
      // Only cleanup if we were previously initialized
      this.cleanup();
      this.initializationPending = false;
    }
  }

  ngAfterViewChecked(): void {
    // Initialize camera once the video element is available in the DOM
    if (this.initializationPending) {
      console.log('AfterViewChecked - initializationPending:', this.initializationPending);
      console.log('AfterViewChecked - capturedImage:', this.capturedImage);
      console.log('AfterViewChecked - videoElement exists:', !!this.videoElement);
      console.log('AfterViewChecked - videoElement.nativeElement:', !!this.videoElement?.nativeElement);
      
      if (this.videoElement?.nativeElement && !this.cameraInitialized) {
        console.log('Video element detected in DOM, initializing camera');
        this.initializationPending = false;
        
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.initializeCamera();
        }, 100);
      }
    }
  }

  async initializeCamera(): Promise<void> {
    try {
      this.error = '';
      console.log('Initializing camera...');
      
      // Check camera permissions first
      const permissionStatus = await this.checkCameraPermissions();
      if (permissionStatus === 'denied') {
        this.error = 'Camera access denied. Please enable camera permissions in your browser settings and refresh the page.';
        return;
      }
      
      // Video element should already be available since we're called from AfterViewChecked
      const videoElement = this.videoElement?.nativeElement;
      if (!videoElement) {
        this.error = 'Camera initialization failed. You can skip verification or try again.';
        console.error('Video element not available');
        return;
      }
      
      console.log('Video element found, proceeding with camera setup');

      const cameraAvailable = await this.faceScanService.isCameraAvailable();
      console.log('Camera available:', cameraAvailable);
      
      if (!cameraAvailable) {
        this.error = 'No camera found. Please ensure your device has a camera.';
        return;
      }

      // Show permission prompt message
      if (permissionStatus === 'prompt') {
        this.error = 'Please allow camera access when prompted by your browser.';
      }

      const initialized = await this.faceScanService.initializeCamera();
      console.log('Camera initialized:', initialized);
      
      if (initialized) {
        console.log('Starting video stream...');
        this.error = ''; // Clear any permission messages
        await this.setupVideoStream(videoElement);
      } else {
        this.error = 'Camera access denied. Please allow camera permissions and try again.';
      }
    } catch (error: any) {
      console.error('Camera initialization error:', error);
      
      if (error.name === 'NotAllowedError') {
        this.error = 'Camera access denied. Please allow camera permissions in your browser and try again.';
      } else if (error.name === 'NotFoundError') {
        this.error = 'No camera found. Please ensure your device has a camera connected.';
      } else if (error.name === 'NotReadableError') {
        this.error = 'Camera is being used by another application. Please close other apps using the camera.';
      } else {
        this.error = `Camera error: ${error.message || 'Unknown error occurred'}`;
      }
    }
  }

  private async checkCameraPermissions(): Promise<string> {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        console.log('Camera permission status:', permission.state);
        return permission.state;
      }
      return 'prompt'; // Default to prompt if permissions API not available
    } catch (error) {
      console.log('Permissions API not available, assuming prompt');
      return 'prompt';
    }
  }

  private async waitForVideoElement(): Promise<HTMLVideoElement | null> {
    const maxAttempts = 15;
    const delay = 300;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Check if modal is still open
      if (!this.isOpen) {
        console.log('Modal closed while waiting for video element');
        return null;
      }
      
      if (this.videoElement?.nativeElement) {
        console.log(`Video element found on attempt ${attempt + 1}`);
        return this.videoElement.nativeElement;
      }
      
      if (attempt === 0) {
        console.log('Waiting for video element to be rendered in DOM...');
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.error('Video element not found after maximum attempts');
    console.error('Modal open:', this.isOpen);
    console.error('Captured image:', !!this.capturedImage);
    console.error('Video element exists:', !!this.videoElement);
    return null;
  }

  private async setupVideoStream(videoElement: HTMLVideoElement): Promise<void> {
    try {
      console.log('Setting up video stream...');
      
      // Start the video stream
      const streamStarted = this.faceScanService.startVideoStream(videoElement);
      
      if (!streamStarted) {
        throw new Error('Failed to start video stream');
      }
      
      // Wait for the video to be ready
      let attempts = 0;
      const maxAttempts = 20; // 4 seconds total
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log(`Checking video readiness, attempt ${attempts + 1}`);
        console.log('Video readyState:', videoElement.readyState);
        console.log('Video srcObject:', !!videoElement.srcObject);
        console.log('Video paused:', videoElement.paused);
        console.log('Video videoWidth:', videoElement.videoWidth);
        console.log('Video videoHeight:', videoElement.videoHeight);
        
        // Check multiple conditions for video readiness
        if (videoElement.srcObject && 
            (videoElement.readyState >= 2 || videoElement.videoWidth > 0)) {
          console.log('Video stream is ready!');
          this.cameraInitialized = true;
          return;
        }
        
        attempts++;
      }
      
      // If we get here, video didn't become ready in time
      // But if we have a stream, let's still try to use it
      if (videoElement.srcObject) {
        console.log('Video stream exists but may not be fully ready, proceeding anyway');
        this.cameraInitialized = true;
        return;
      }
      
      throw new Error('Video stream failed to initialize properly');
      
    } catch (error) {
      console.error('Video stream setup failed:', error);
      throw error;
    }
  }

  startScan(): void {
    if (!this.cameraInitialized) {
      this.error = 'Camera not ready. Please wait or refresh the page.';
      return;
    }

    this.scanning = true;
    this.scanResult = null;
    this.error = '';
    this.countdown = 3;

    // Countdown before capture
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.captureAndScan();
      }
    }, 1000);
  }

  async captureAndScan(): Promise<void> {
    try {
      // If image is already captured, just complete
      if (this.capturedImage) {
        this.scanResult = {
          success: true,
          confidence: 100,
          imageData: this.capturedImage,
          message: 'Photo captured successfully'
        };
        this.scanning = false;
        
        // Stop the camera stream
        this.faceScanService.stopCamera();
        
        // Auto-close after 1 second
        setTimeout(() => {
          this.completeScan();
        }, 1000);
        return;
      }

      // Capture the image
      const imageData = this.faceScanService.captureImage();
      
      if (!imageData) {
        this.error = 'Failed to capture image. Please try again.';
        this.scanning = false;
        return;
      }

      // Store the captured image for preview
      this.capturedImage = imageData;
      
      // Stop the camera stream since we have the image
      this.faceScanService.stopCamera();

      // Just mark as successful - no face recognition needed
      this.scanResult = {
        success: true,
        confidence: 100,
        imageData: imageData,
        message: 'Photo captured successfully'
      };
      this.scanning = false;

      // Auto-close after 1 second
      setTimeout(() => {
        this.completeScan();
      }, 1000);
    } catch (error) {
      console.error('Photo capture error:', error);
      this.error = 'Photo capture failed. Please try again.';
      this.scanning = false;
    }
  }

  retakePhoto(): void {
    this.capturedImage = null;
    this.scanResult = null;
    this.error = '';
    this.initializeCamera();
  }

  completeScan(): void {
    if (this.scanResult) {
      this.scanComplete.emit(this.scanResult);
    }
    this.close();
  }

  close(): void {
    this.cleanup();
    this.closeModal.emit();
  }

  skipVerification(): void {
    // Emit a successful result without actual face verification
    const skipResult: FaceScanResult = {
      success: true,
      confidence: 0,
      imageData: '',
      message: 'Face verification skipped by user'
    };
    
    this.scanComplete.emit(skipResult);
    this.close();
  }

  private cleanup(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.faceScanService.stopCamera();
    this.cameraInitialized = false;
    this.scanning = false;
    this.scanResult = null;
    this.countdown = 0;
    this.error = '';
    this.capturedImage = null;
    this.initializationPending = false;
  }

  private softReset(): void {
    // Reset state without stopping camera
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.scanning = false;
    this.scanResult = null;
    this.countdown = 0;
    this.error = '';
  }

  retryCamera(): void {
    this.softReset();
    setTimeout(() => {
      this.initializeCamera();
    }, 500);
  }

  async requestCameraPermission(): Promise<void> {
    try {
      this.error = 'Requesting camera access... Please allow when prompted.';
      
      // If we already have a working camera, don't request again
      if (this.cameraInitialized) {
        this.error = '';
        return;
      }
      
      // Force a permission request by trying to access the camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      
      // Stop the stream immediately - we just wanted to trigger permission
      stream.getTracks().forEach(track => track.stop());
      
      // Now try to initialize properly
      this.error = '';
      setTimeout(() => {
        this.initializeCamera();
      }, 500);
      
    } catch (error: any) {
      console.error('Permission request failed:', error);
      
      if (error.name === 'NotAllowedError') {
        this.error = 'Camera access denied. Please check your browser settings and allow camera access for this site.';
      } else {
        this.error = 'Failed to request camera permission. Please try again.';
      }
    }
  }

  // Simple fallback method that bypasses complex initialization
  async forceInitializeCamera(): Promise<void> {
    try {
      this.error = '';
      console.log('Force initializing camera...');
      
      // Get video element
      if (!this.videoElement?.nativeElement) {
        this.error = 'Video element not available';
        return;
      }
      
      const videoElement = this.videoElement.nativeElement;
      
      // Get camera stream directly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      
      // Set up video element
      videoElement.srcObject = stream;
      videoElement.muted = true;
      videoElement.playsInline = true;
      videoElement.autoplay = true;
      
      // Store stream in service
      this.faceScanService.setStream(stream, videoElement);
      
      // Mark as initialized
      this.cameraInitialized = true;
      
      console.log('Camera force initialized successfully');
      
    } catch (error: any) {
      console.error('Force initialization failed:', error);
      this.error = 'Failed to initialize camera: ' + error.message;
    }
  }

  // Add method to handle video element ready state
  onVideoElementReady(): void {
    if (!this.cameraInitialized && this.isOpen) {
      this.initializeCamera();
    }
  }
}