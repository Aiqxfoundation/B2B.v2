import { useState, useRef, useEffect, useCallback } from "react";
import * as faceapi from 'face-api.js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Camera, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  ArrowLeft, 
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Eye
} from "lucide-react";

interface FaceKYCProps {
  onComplete: (kycData: { deviceFingerprint: string; verificationHash: string }) => void;
  onBack: () => void;
}

type KYCStep = 
  | 'camera-permission'
  | 'position-face'
  | 'turn-left'
  | 'turn-right'
  | 'turn-up'
  | 'turn-down'
  | 'blink'
  | 'processing'
  | 'complete';

const KYC_STEPS = [
  { id: 'camera-permission' as const, title: 'Camera Access', instruction: 'Allow camera access' },
  { id: 'position-face' as const, title: 'Position Face', instruction: 'Position Your Face In The Frame!' },
  { id: 'turn-left' as const, title: 'Turn Left', instruction: 'Turn Your Face Slowly To Left' },
  { id: 'turn-right' as const, title: 'Turn Right', instruction: 'Turn Your Face Slowly To Right' },
  { id: 'turn-up' as const, title: 'Turn Up', instruction: 'Turn Your Face Slowly Up' },
  { id: 'turn-down' as const, title: 'Turn Down', instruction: 'Turn Your Face Slowly Down' },
  { id: 'blink' as const, title: 'Blink', instruction: 'Blink Your Eyes' },
  { id: 'processing' as const, title: 'Processing', instruction: 'Processing...' },
  { id: 'complete' as const, title: 'Complete', instruction: 'Verification Complete!' }
];

export default function FaceKYC({ onComplete, onBack }: FaceKYCProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionRef = useRef<number | null>(null);
  
  const [currentStep, setCurrentStep] = useState<KYCStep>('camera-permission');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceQuality, setFaceQuality] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerified, setShowVerified] = useState(false);
  const [stepProgress, setStepProgress] = useState(0);
  const [consecutiveValidFrames, setConsecutiveValidFrames] = useState(0);
  const [hasPlayedMovementSound, setHasPlayedMovementSound] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);

  const currentStepIndex = KYC_STEPS.findIndex(step => step.id === currentStep);
  const currentStepData = KYC_STEPS[currentStepIndex];
  
  // Calculate angles consistently - skip camera-permission step
  const actualSteps = KYC_STEPS.slice(1); // Remove camera-permission for angle calculation
  const segmentAngle = 360 / actualSteps.length;
  const actualStepIndex = Math.max(0, currentStepIndex - 1); // Adjust for skipped camera-permission
  const completedAngle = actualStepIndex * segmentAngle;

  // Play success sound
  const playSuccessSound = useCallback(() => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSaB0fPZdikAFmq88vLCciUFLYLQ88V6JwgYacHw3ot4CAsZY7Ht5qNMEQtPpOPxx2AeBSuC0vNcciQFLA==');
    audio.volume = 0.6;
    audio.play().catch(() => {});
  }, []);

  // Play movement detection sound (softer tick)
  const playMovementSound = useCallback(() => {
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEEAC0hAQBdwwIAAgAEAGRhdGEPGwAAAICBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt5p5NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSaB0fPZdikAFmq88vLCciUFLYLQ88V6JwgYacHw3ot4CAVYrOjnqlgVDiON2/DgfSkFKYTW8NOIQAwZbLvt5Z5NEAxQp+PwtmMcBjiQ2O3MdfGgVHYoEqSSSLLXqkFGZnFDhIOEd7VdZ4+2rZZnqKOFgaatJlEwgdvxwxqLUJaQOm9bvGWpGVbhKmAyNGbsHJXR0jNhIDYD');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }, []);

  // Speak instruction
  const speak = useCallback((text: string) => {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  }, []);

  // Load Face-API models faster
  useEffect(() => {
    const loadFaceApiModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model'),
          faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model'),
        ]);
        console.log('Face-API models loaded successfully');
        setFaceApiLoaded(true);
      } catch (error) {
        console.error('Failed to load Face-API models:', error);
        setFaceApiLoaded(false);
      }
    };
    
    loadFaceApiModels();
  }, []);

  // Calculate Eye Aspect Ratio for blink detection
  const calculateEyeAspectRatio = useCallback((eyeLandmarks: faceapi.Point[]) => {
    // Calculate distances between eye landmarks
    const p1p5 = Math.sqrt(Math.pow(eyeLandmarks[1].x - eyeLandmarks[5].x, 2) + Math.pow(eyeLandmarks[1].y - eyeLandmarks[5].y, 2));
    const p2p4 = Math.sqrt(Math.pow(eyeLandmarks[2].x - eyeLandmarks[4].x, 2) + Math.pow(eyeLandmarks[2].y - eyeLandmarks[4].y, 2));
    const p0p3 = Math.sqrt(Math.pow(eyeLandmarks[0].x - eyeLandmarks[3].x, 2) + Math.pow(eyeLandmarks[0].y - eyeLandmarks[3].y, 2));
    
    // Eye Aspect Ratio formula
    const ear = (p1p5 + p2p4) / (2.0 * p0p3);
    return ear;
  }, []);

  // Calculate head pose using landmarks
  const calculateHeadPose = useCallback((landmarks: faceapi.FaceLandmarks68) => {
    const nose = landmarks.getNose()[3]; // Nose tip
    const leftEye = landmarks.getLeftEye()[0]; // Left eye corner
    const rightEye = landmarks.getRightEye()[3]; // Right eye corner
    const mouth = landmarks.getMouth()[0]; // Left mouth corner
    
    // Calculate eye center
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;
    
    // Calculate yaw (left-right) based on nose position relative to eye center
    const yawThreshold = 15; // pixels
    let yaw = 'center';
    if (nose.x < eyeCenterX - yawThreshold) yaw = 'left';
    else if (nose.x > eyeCenterX + yawThreshold) yaw = 'right';
    
    // Calculate pitch (up-down) based on nose position relative to eye-mouth midpoint
    const eyeMouthMidY = (eyeCenterY + mouth.y) / 2;
    const pitchThreshold = 10; // pixels
    let pitch = 'center';
    if (nose.y < eyeMouthMidY - pitchThreshold) pitch = 'up';
    else if (nose.y > eyeMouthMidY + pitchThreshold) pitch = 'down';
    
    return { yaw, pitch };
  }, []);

  // Fast face detection with proper liveness detection
  const detectFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !faceApiLoaded) {
      return { detected: false, quality: 0, position: null, blink: false, headPose: null };
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { detected: false, quality: 0, position: null, blink: false, headPose: null };
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const detections = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.2
      })).withFaceLandmarks();
      
      if (detections.length === 0) {
        return { detected: false, quality: 0, position: null, blink: false, headPose: null };
      }
      
      const detection = detections[0];
      const box = detection.detection.box;
      const confidence = detection.detection.score;
      const landmarks = detection.landmarks;
      
      // Check face position and size
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const videoCenterX = canvas.width / 2;
      const videoCenterY = canvas.height / 2;
      
      const distanceFromCenter = Math.sqrt(
        Math.pow(centerX - videoCenterX, 2) + Math.pow(centerY - videoCenterY, 2)
      );
      
      const maxDistance = Math.min(canvas.width, canvas.height) * 0.25;
      const isWellPositioned = distanceFromCenter < maxDistance;
      const isGoodSize = box.width > canvas.width * 0.15 && box.height > canvas.height * 0.2;
      
      const quality = confidence * (isWellPositioned ? 1 : 0.5) * (isGoodSize ? 1 : 0.5);
      const detected = confidence > 0.3 && isWellPositioned && isGoodSize;
      
      let position = 'center';
      let blink = false;
      let headPose = null;
      
      if (landmarks && detected) {
        // Calculate head pose for better movement detection
        headPose = calculateHeadPose(landmarks);
        
        // Determine position based on head pose
        if (headPose.yaw === 'left') position = 'left';
        else if (headPose.yaw === 'right') position = 'right';
        else if (headPose.pitch === 'up') position = 'up';
        else if (headPose.pitch === 'down') position = 'down';
        
        // Calculate blink using Eye Aspect Ratio
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        
        const leftEAR = calculateEyeAspectRatio(leftEye);
        const rightEAR = calculateEyeAspectRatio(rightEye);
        const avgEAR = (leftEAR + rightEAR) / 2;
        
        // EAR threshold for blink detection (typically around 0.2-0.25)
        blink = avgEAR < 0.23;
      }
      
      return { detected, quality, position, blink, headPose };
      
    } catch (error) {
      console.error('Face detection error:', error);
      return { detected: false, quality: 0, position: null, blink: false, headPose: null };
    }
  }, [faceApiLoaded, calculateHeadPose, calculateEyeAspectRatio]);

  // Complete current step
  const completeCurrentStep = useCallback(() => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep);
    setCompletedSteps(newCompleted);
    setStepProgress(0);
    setConsecutiveValidFrames(0);
    setHasPlayedMovementSound(false);

    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < KYC_STEPS.length) {
      const nextStep = KYC_STEPS[nextStepIndex];
      setCurrentStep(nextStep.id);
      
      setTimeout(() => {
        if (nextStep.id === 'processing') {
          processKYC();
        } else {
          speak(nextStep.instruction);
        }
      }, 500);
    }
  }, [currentStep, currentStepIndex, completedSteps, speak]);

  // Real-time face detection loop with proper liveness detection
  useEffect(() => {
    if (currentStep === 'camera-permission' || currentStep === 'processing' || currentStep === 'complete') {
      return;
    }

    const runDetection = async () => {
      const result = await detectFace();
      setFaceDetected(result.detected);
      setFaceQuality(result.quality);
      
      // Require face detection for all steps
      if (!result.detected) {
        setConsecutiveValidFrames(0);
        setHasPlayedMovementSound(false);
        detectionRef.current = requestAnimationFrame(runDetection);
        return;
      }
      
      // Handle step progression with proper liveness detection
      let isValidAction = false;
      
      if (currentStep === 'position-face') {
        // Just need good face detection for positioning
        isValidAction = result.detected;
      } else if (currentStep === 'turn-left') {
        isValidAction = result.position === 'left' && result.headPose?.yaw === 'left';
      } else if (currentStep === 'turn-right') {
        isValidAction = result.position === 'right' && result.headPose?.yaw === 'right';
      } else if (currentStep === 'turn-up') {
        isValidAction = result.position === 'up' && result.headPose?.pitch === 'up';
      } else if (currentStep === 'turn-down') {
        isValidAction = result.position === 'down' && result.headPose?.pitch === 'down';
      } else if (currentStep === 'blink') {
        isValidAction = result.blink === true;
      }
      
      if (isValidAction) {
        setConsecutiveValidFrames(prev => {
          const newCount = prev + 1;
          
          // Play movement sound on first valid detection
          if (newCount === 1 && !hasPlayedMovementSound) {
            playMovementSound();
            setHasPlayedMovementSound(true);
          }
          
          return newCount;
        });
        
        // Require 3 consecutive valid frames for robustness
        if (consecutiveValidFrames >= 2) {
          setStepProgress(prev => {
            const newProgress = Math.min(prev + 8, 100);
            
            // Complete step when progress reaches 100%
            if (newProgress >= 100) {
              playSuccessSound();
              speak('Perfect!');
              setTimeout(() => completeCurrentStep(), 100);
            }
            
            return newProgress;
          });
        }
      } else {
        // Strict reset to 0 for consecutive frame validation
        setConsecutiveValidFrames(0);
        setStepProgress(prev => Math.max(prev - 1, 0));
        setHasPlayedMovementSound(false);
      }
      
      detectionRef.current = requestAnimationFrame(runDetection);
    };

    // Reset state when step changes
    setConsecutiveValidFrames(0);
    setStepProgress(0);
    setHasPlayedMovementSound(false);
    
    detectionRef.current = requestAnimationFrame(runDetection);
    
    return () => {
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
      }
    };
  }, [currentStep, consecutiveValidFrames, stepProgress, hasPlayedMovementSound, detectFace, playSuccessSound, playMovementSound, speak, completeCurrentStep]);

  // Initialize camera with mobile-optimized error handling
  const initializeCamera = async () => {
    try {
      setError(null);
      console.log('initializeCamera called - checking environment...');
      
      // Environment checks
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not available');
        setError('Camera not supported by this browser. Please use a modern browser.');
        return;
      }

      console.log('Environment check passed, requesting permissions...');
      speak('Starting camera. Please allow permissions.');
      
      // Mobile-optimized constraints with fallbacks
      const constraints = {
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          facingMode: 'user',
          frameRate: { ideal: 15, max: 25 }
        },
        audio: false
      };

      console.log('getUserMedia constraints:', constraints);
      
      // Add timeout for mobile browsers that hang
      const streamPromise = navigator.mediaDevices.getUserMedia(constraints);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Camera request timeout')), 10000)
      );
      
      const stream = await Promise.race([streamPromise, timeoutPromise]) as MediaStream;
      console.log('Camera stream obtained:', stream);
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Direct approach that works in iframe contexts
        console.log('Setting video properties...');
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        
        // Immediate success - bypass video events that can hang in iframes
        setTimeout(() => {
          console.log('Camera initialized successfully, proceeding to next step');
          setIsInitializing(false);
          setCurrentStep('position-face');
          speak('Position Your Face In The Frame!');
        }, 500);
      }
      
    } catch (err: any) {
      console.error('Camera initialization failed:', err);
      
      let errorMessage = 'Camera access failed.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings and refresh the page.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please ensure your device has a camera.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported. Please use a different browser.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is busy. Please close other apps using the camera and try again.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Camera request timed out. Please try again or check your camera permissions.';
      } else {
        errorMessage = `Camera error: ${err.message || 'Unknown error'}. Please try refreshing the page.`;
      }
      
      setIsInitializing(false);
      setError(errorMessage);
      speak(errorMessage);
      
      // Add retry mechanism for mobile
      if (retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          setError(null);
        }, 3000);
      }
    }
  };


  // Process KYC completion
  const processKYC = async () => {
    setIsProcessing(true);
    speak('Processing verification...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const kycData = await generateKYCData();
      setCurrentStep('complete');
      
      // Play final success sound and show verified popup
      playSuccessSound();
      speak('Verification Complete! You have been successfully verified.');
      setShowVerified(true);
      
      setTimeout(() => {
        onComplete(kycData);
      }, 4000);
      
    } catch (err) {
      setError('Processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  // Generate KYC data
  const generateKYCData = useCallback(async (): Promise<{ deviceFingerprint: string; verificationHash: string }> => {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: Date.now()
    };

    const fingerprintData = JSON.stringify(deviceInfo);
    const fingerprintBuffer = new TextEncoder().encode(fingerprintData);
    const fingerprintHashBuffer = await crypto.subtle.digest('SHA-256', fingerprintBuffer);
    const fingerprintHash = Array.from(new Uint8Array(fingerprintHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const verificationData = {
      kycCompleted: true,
      stepsCompleted: Array.from(completedSteps),
      deviceFingerprint: fingerprintHash,
      verificationTime: new Date().toISOString()
    };

    const verificationDataString = JSON.stringify(verificationData);
    const verificationBuffer = new TextEncoder().encode(verificationDataString);
    const verificationHashBuffer = await crypto.subtle.digest('SHA-256', verificationBuffer);
    const verificationHash = Array.from(new Uint8Array(verificationHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return { deviceFingerprint: fingerprintHash, verificationHash };
  }, [completedSteps]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4" data-testid="face-kyc-container">
      <Card className="w-full max-w-2xl border-[#f7931a]/20 bg-gray-950">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl text-white flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-[#f7931a]" />
            Face Verification
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert className="border-red-500/50 bg-red-500/10" data-testid="error-alert">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          {/* Camera Setup */}
          {currentStep === 'camera-permission' && (
            <div className="text-center space-y-4" data-testid="camera-permission-step">
              <div className="w-20 h-20 mx-auto bg-[#f7931a]/20 rounded-full flex items-center justify-center">
                <Camera className="w-10 h-10 text-[#f7931a]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Camera Access Required</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  We need camera access for face verification. No photos are stored.
                </p>
              </div>
              <Button 
                onClick={initializeCamera}
                disabled={isInitializing}
                className="bg-[#f7931a] hover:bg-[#f7931a]/80 text-black font-semibold disabled:opacity-50"
                data-testid="button-start-camera"
              >
                {isInitializing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Initializing Camera...
                  </div>
                ) : (
                  <>Start Camera {retryCount > 0 && `(Attempt ${retryCount + 1})`}</>
                )}
              </Button>
            </div>
          )}

          {/* Face Detection Interface */}
          {currentStep !== 'camera-permission' && currentStep !== 'complete' && (
            <div className="space-y-4" data-testid="face-detection-interface">
              {/* Instruction */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2" data-testid="text-instruction">
                  {currentStepData.instruction}
                </h3>
                
                {/* Quality Measure Line */}
                <div className="w-full max-w-xs mx-auto bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-200"
                    style={{ width: `${Math.max(faceQuality * 100, 10)}%` }}
                    data-testid="quality-measure"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Quality: {Math.round(faceQuality * 100)}%</p>
              </div>

              {/* Video Container with Circular Progress */}
              <div className="relative mx-auto w-80 h-80">
                {/* Circular Progress Ring */}
                <svg 
                  className="absolute inset-0 w-full h-full -rotate-90 z-10" 
                  viewBox="0 0 100 100"
                  data-testid="circular-progress"
                >
                  {/* Background Circle */}
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="rgba(156, 163, 175, 0.3)"
                    strokeWidth="2"
                  />
                  {/* Completed Progress */}
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="#f7931a"
                    strokeWidth="3"
                    strokeDasharray={`${completedAngle * 0.785} 283`}
                    className="transition-all duration-1000 ease-out"
                  />
                  {/* Current Step Progress */}
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                    strokeDasharray={`${(stepProgress / 100) * segmentAngle * 0.785} 283`}
                    strokeDashoffset={`${-completedAngle * 0.785}`}
                    className="transition-all duration-200"
                  />
                </svg>

                {/* Video Element */}
                <div className="absolute inset-4 rounded-full overflow-hidden bg-gray-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                    data-testid="video-feed"
                  />
                  
                  {/* Face Detection Indicator */}
                  {faceDetected && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" data-testid="face-detected-indicator" />
                  )}
                  
                  {/* Direction Indicator */}
                  {currentStep.includes('turn') && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {currentStep === 'turn-left' && <ArrowLeft className="w-8 h-8 text-white/70" />}
                      {currentStep === 'turn-right' && <ArrowRight className="w-8 h-8 text-white/70" />}
                      {currentStep === 'turn-up' && <ArrowUp className="w-8 h-8 text-white/70" />}
                      {currentStep === 'turn-down' && <ArrowDown className="w-8 h-8 text-white/70" />}
                    </div>
                  )}
                  
                  {currentStep === 'blink' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Eye className="w-8 h-8 text-white/70" />
                    </div>
                  )}
                </div>

                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Processing State */}
              {currentStep === 'processing' && (
                <div className="text-center" data-testid="processing-state">
                  <div className="w-8 h-8 border-2 border-[#f7931a] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-white">Processing verification...</p>
                </div>
              )}
            </div>
          )}

          {/* Back Button - Hidden as requested by user */}
          {false && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={onBack}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                data-testid="button-back"
              >
                Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Complete Dialog */}
      <Dialog open={showVerified} onOpenChange={setShowVerified}>
        <DialogContent className="bg-gray-900 border-[#f7931a]/20 text-white" data-testid="verified-popup">
          <DialogHeader className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              {/* Animated Circle */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="4"
                  strokeDasharray="251"
                  strokeDashoffset="251"
                  className="animate-[drawCircle_2s_ease-out_forwards]"
                />
              </svg>
              {/* Check Icon */}
              <div className="absolute inset-0 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white animate-[fadeIn_1.5s_ease-out_forwards] opacity-0" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-green-400">Verified!</DialogTitle>
            <DialogDescription className="text-gray-300">
              Your face verification has been completed successfully. You can now proceed with account creation.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Custom Animations */}
      <style>{`
        @keyframes drawCircle {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}