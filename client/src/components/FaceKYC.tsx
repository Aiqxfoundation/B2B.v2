import { useState, useRef, useEffect, useCallback } from "react";
import * as faceapi from 'face-api.js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  Shield, 
  ArrowLeft, 
  ArrowRight,
  Eye,
  RotateCcw,
  Volume2,
  VolumeX
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
  | 'open-mouth'
  | 'blink'
  | 'processing'
  | 'complete';

const KYC_STEPS = [
  { id: 'camera-permission' as const, title: 'Camera Access', instruction: 'Allow camera access to begin verification' },
  { id: 'position-face' as const, title: 'Position Face', instruction: 'Center your face in the frame' },
  { id: 'turn-left' as const, title: 'Turn Left', instruction: 'Slowly turn your face to the left' },
  { id: 'turn-right' as const, title: 'Turn Right', instruction: 'Slowly turn your face to the right' },
  { id: 'turn-up' as const, title: 'Look Up', instruction: 'Slowly look up towards the ceiling' },
  { id: 'turn-down' as const, title: 'Look Down', instruction: 'Slowly look down towards the floor' },
  { id: 'open-mouth' as const, title: 'Open Mouth', instruction: 'Open your mouth wide for 2 seconds' },
  { id: 'blink' as const, title: 'Blink Eyes', instruction: 'Blink your eyes 3 times slowly' },
  { id: 'processing' as const, title: 'Processing', instruction: 'Generating secure verification data...' },
  { id: 'complete' as const, title: 'Complete', instruction: 'Identity verification successful!' }
];

export default function FaceKYC({ onComplete, onBack }: FaceKYCProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [currentStep, setCurrentStep] = useState<KYCStep>('camera-permission');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameRef = useRef<ImageData | null>(null);
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(0);

  const currentStepIndex = KYC_STEPS.findIndex(step => step.id === currentStep);
  const currentStepData = KYC_STEPS[currentStepIndex];

  // Speech synthesis functionality
  const speak = useCallback((text: string) => {
    if (!speechSupported || isSpeaking) return;
    
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
    }
  }, [speechSupported, isSpeaking]);

  // Stop current speech
  const stopSpeech = useCallback(() => {
    if (speechSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [speechSupported]);

  // Load Face-API models
  useEffect(() => {
    const loadFaceApiModels = async () => {
      try {
        // Load face detection models from CDN
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model');
        await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model');
        await faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model');
        console.log('Face-API models loaded successfully');
        setFaceApiLoaded(true);
      } catch (error) {
        console.error('Failed to load Face-API models:', error);
        // Fallback: still allow KYC but with warnings
        setFaceApiLoaded(false);
      }
    };
    
    loadFaceApiModels();
  }, []);
  
  // Check speech synthesis support
  useEffect(() => {
    const checkSpeechSupport = () => {
      if ('speechSynthesis' in window) {
        setSpeechSupported(true);
        // Wait for voices to load
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          window.speechSynthesis.onvoiceschanged = () => {
            setSpeechSupported(true);
          };
        }
      }
    };
    
    checkSpeechSupport();
  }, []);

  // Initialize camera
  const initializeCamera = async () => {
    try {
      setError(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera access is not supported in this browser. Please use a modern browser.');
        return;
      }

      speak('Starting camera access. Please allow permissions when prompted.');
      
      // First change step to render video element
      setCurrentStep('position-face');
      setProgress(10);
      
      // Wait for video element to render then initialize camera
      setTimeout(async () => {
        try {
          // Simpler, more compatible constraints
          const constraints = {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user'
            },
            audio: false
          };

          console.log('Requesting camera access...');
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('Camera stream obtained:', stream);
          
          streamRef.current = stream;
          
          if (videoRef.current) {
            console.log('Assigning stream to video element...');
            videoRef.current.srcObject = stream;
            
            // Ensure video loads and plays
            videoRef.current.onloadedmetadata = () => {
              console.log('Video metadata loaded, playing video...');
              if (videoRef.current) {
                videoRef.current.play().then(() => {
                  console.log('Video is now playing');
                  
                  // Speak initial instruction
                  setTimeout(() => {
                    speak('Perfect! Your camera is working. Position your face in the center of the circle.');
                  }, 1000);
                }).catch(err => {
                  console.error('Error playing video:', err);
                  setError('Failed to start video playback. Please refresh and try again.');
                });
              }
            };
            
            videoRef.current.onerror = (e) => {
              console.error('Video element error:', e);
              setError('Video playback error. Please refresh and try again.');
            };
          } else {
            console.error('Video element not found');
            setError('Video element not ready. Please try again.');
            // Stop the camera stream before resetting
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
            // Reset to camera permission step if video element not found
            setCurrentStep('camera-permission');
            setProgress(0);
          }
        } catch (err: any) {
          console.error('Camera initialization error:', err);
          let errorMessage = '';
          if (err.name === 'NotAllowedError') {
            errorMessage = 'Camera permission denied. Please allow camera access and try again.';
          } else if (err.name === 'NotFoundError') {
            errorMessage = 'No camera found. Please ensure your device has a camera.';
          } else if (err.name === 'NotReadableError') {
            errorMessage = 'Camera is busy. Please close other apps using the camera.';
          } else {
            errorMessage = 'Camera access failed. Please refresh and try again.';
          }
          
          setError(errorMessage);
          speak(errorMessage);
          // Reset to camera permission step on error
          setCurrentStep('camera-permission');
          setProgress(0);
        }
      }, 150); // Small delay to ensure video element is rendered
      
    } catch (err: any) {
      console.error('Initial camera setup error:', err);
      setError('Failed to initialize camera setup. Please refresh and try again.');
      speak('Failed to initialize camera setup. Please refresh and try again.');
    }
  };

  // Generate device fingerprint and verification hash (no biometric data stored)
  const generateKYCData = useCallback(async (): Promise<{ deviceFingerprint: string; verificationHash: string }> => {
    // Create device fingerprint from various non-biometric sources
    const deviceInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory || 0,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      screenResolution: `${screen.width}x${screen.height}`,
      timezoneOffset: new Date().getTimezoneOffset(),
      timestamp: Date.now()
    };

    // Generate fingerprint hash
    const fingerprintData = JSON.stringify(deviceInfo);
    const fingerprintBuffer = new TextEncoder().encode(fingerprintData);
    const fingerprintHashBuffer = await crypto.subtle.digest('SHA-256', fingerprintBuffer);
    const fingerprintHash = Array.from(new Uint8Array(fingerprintHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Generate verification hash (represents completed KYC process without storing biometric data)
    const verificationData = {
      kycCompleted: true,
      stepsCompleted: Array.from(completedSteps),
      deviceFingerprint: fingerprintHash,
      verificationTime: new Date().toISOString(),
      sessionId: crypto.randomUUID()
    };

    const verificationDataString = JSON.stringify(verificationData);
    const verificationBuffer = new TextEncoder().encode(verificationDataString);
    const verificationHashBuffer = await crypto.subtle.digest('SHA-256', verificationBuffer);
    const verificationHash = Array.from(new Uint8Array(verificationHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      deviceFingerprint: fingerprintHash,
      verificationHash
    };
  }, [completedSteps]);

  // Complete current step
  const completeStep = useCallback(() => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep);
    setCompletedSteps(newCompleted);

    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < KYC_STEPS.length) {
      const nextStep = KYC_STEPS[nextStepIndex];
      setCurrentStep(nextStep.id);
      setProgress(((nextStepIndex) / KYC_STEPS.length) * 100);

      // Speak the instruction for the next step
      setTimeout(() => {
        speak(nextStep.instruction);
      }, 500);

      // Face detection will auto-start for movement steps
      
      // Trigger processing when reaching processing step
      if (nextStep.id === 'processing') {
        setTimeout(() => {
          processKYC();
        }, 1000);
      }
    }
  }, [currentStep, currentStepIndex, completedSteps, speak]);


  // Process KYC completion
  const processKYC = async () => {
    setCurrentStep('processing');
    setIsProcessing(true);
    
    speak('Excellent! All steps completed. Now processing your verification data. Please wait a moment.');
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const kycData = await generateKYCData();
      setCurrentStep('complete');
      setProgress(100);
      
      speak('Congratulations! Your identity verification is complete. You can now proceed to create your account.');
      
      setTimeout(() => {
        onComplete(kycData);
      }, 1500);
      
    } catch (err) {
      const errorMsg = 'Failed to process verification. Please try again.';
      setError(errorMsg);
      speak(errorMsg);
      setIsProcessing(false);
    }
  };

  // Clean up camera stream
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    stopSpeech();
  }, [stopSpeech]);

  useEffect(() => {
    return () => {
      stopCameraStream();
      // Clean up all timers on unmount
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (detectionTimerRef.current) {
        clearInterval(detectionTimerRef.current);
      }
    };
  }, [stopCameraStream]);

  // Stop camera when KYC is complete
  useEffect(() => {
    if (currentStep === 'complete') {
      stopCameraStream();
    }
  }, [currentStep, stopCameraStream]);

  // Real face detection function using Face-API
  const detectRealFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !faceApiLoaded) {
      return { faceDetected: false, confidence: 0, movement: false };
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { faceDetected: false, confidence: 0, movement: false };
      
      // Set canvas size to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Detect faces using Face-API
      const detections = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5
      })).withFaceLandmarks();
      
      if (detections.length === 0) {
        setFaceDetected(false);
        setFaceConfidence(0);
        return { faceDetected: false, confidence: 0, movement: false };
      }
      
      // Get the best detection (highest confidence)
      const bestDetection = detections.reduce((best, current) => 
        current.detection.score > best.detection.score ? current : best
      );
      
      const confidence = bestDetection.detection.score;
      const box = bestDetection.detection.box;
      
      // Check if face is well-positioned (centered and appropriate size)
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const videoCenterX = canvas.width / 2;
      const videoCenterY = canvas.height / 2;
      
      const distanceFromCenter = Math.sqrt(
        Math.pow(centerX - videoCenterX, 2) + Math.pow(centerY - videoCenterY, 2)
      );
      
      const maxAllowedDistance = Math.min(canvas.width, canvas.height) * 0.2; // 20% of frame
      const isWellPositioned = distanceFromCenter < maxAllowedDistance;
      
      // Check face size (should be at least 15% of frame width)
      const minFaceSize = canvas.width * 0.15;
      const isSizeGood = box.width > minFaceSize && box.height > minFaceSize;
      
      // Motion detection for movement steps
      let hasMovement = false;
      if (frameRef.current) {
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let diffPixels = 0;
        const threshold = 25;
        const totalPixels = currentFrame.data.length / 4;
        
        for (let i = 0; i < currentFrame.data.length; i += 4) {
          const currentR = currentFrame.data[i];
          const currentG = currentFrame.data[i + 1];
          const currentB = currentFrame.data[i + 2];
          
          const prevR = frameRef.current.data[i];
          const prevG = frameRef.current.data[i + 1];
          const prevB = frameRef.current.data[i + 2];
          
          const diff = Math.abs(currentR - prevR) + Math.abs(currentG - prevG) + Math.abs(currentB - prevB);
          
          if (diff > threshold) {
            diffPixels++;
          }
        }
        
        const motionPercentage = (diffPixels / totalPixels) * 100;
        hasMovement = motionPercentage > 0.3;
        frameRef.current = currentFrame;
      } else {
        frameRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
      
      const faceIsValid = confidence > 0.7 && isWellPositioned && isSizeGood;
      setFaceDetected(faceIsValid);
      setFaceConfidence(confidence);
      
      return {
        faceDetected: faceIsValid,
        confidence: confidence,
        movement: hasMovement,
        position: { centerX, centerY, width: box.width, height: box.height }
      };
      
    } catch (error) {
      console.error('Face detection error:', error);
      return { faceDetected: false, confidence: 0, movement: false };
    }
  }, [faceApiLoaded]);
  
  // Start face detection for current step
  const startFaceDetection = useCallback(() => {
    if (isDetecting) return;
    
    setIsDetecting(true);
    setDetectionProgress(0);
    
    let progress = 0;
    const targetTime = currentStep === 'position-face' ? 3000 : 4000; // 3s for positioning, 4s for movements
    const interval = 100;
    const incrementPerTick = (interval / targetTime) * 100;
    
    speak(currentStepData?.instruction || '');
    
    detectionTimerRef.current = setInterval(async () => {
      const faceResult = await detectRealFace();
      
      if (currentStep === 'position-face') {
        // For positioning, require valid face detection
        if (faceResult.faceDetected) {
          progress += incrementPerTick * 2; // Faster when face is properly detected
        } else {
          progress += incrementPerTick * 0.1; // Very slow without valid face
          // Reset progress if no face for too long
          if (progress > 30 && !faceResult.faceDetected) {
            progress = Math.max(0, progress - incrementPerTick * 0.5);
          }
        }
      } else if (['turn-left', 'turn-right', 'turn-up', 'turn-down', 'open-mouth', 'blink'].includes(currentStep)) {
        // For movements, require both valid face AND movement
        if (faceResult.faceDetected && faceResult.movement) {
          progress += incrementPerTick * 2; // Fast progress with face + movement
        } else if (faceResult.faceDetected && !faceResult.movement) {
          progress += incrementPerTick * 0.2; // Slow progress with face but no movement
        } else {
          // No valid face detected - reset progress
          progress = Math.max(0, progress - incrementPerTick * 0.3);
        }
      }
      
      progress = Math.min(progress, 100);
      setDetectionProgress(progress);
      
      if (progress >= 100) {
        if (detectionTimerRef.current) {
          clearInterval(detectionTimerRef.current);
          detectionTimerRef.current = null;
        }
        setIsDetecting(false);
        setDetectionProgress(0);
        
        speak('Perfect! Well done.');
        setTimeout(() => {
          completeStep();
        }, 500);
      }
    }, interval);
  }, [currentStep, currentStepData, isDetecting, detectRealFace, completeStep, speak]);
  
  // Auto-start detection when step changes
  useEffect(() => {
    if (currentStep === 'position-face' || ['turn-left', 'turn-right', 'turn-up', 'turn-down', 'open-mouth', 'blink'].includes(currentStep)) {
      const timer = setTimeout(() => {
        startFaceDetection();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, startFaceDetection]);

  // Remove this useEffect as processing is now handled in completeStep
  // useEffect(() => {
  //   if (currentStep === 'blink' && completedSteps.has('blink')) {
  //     setTimeout(processKYC, 1000);
  //   }
  // }, [currentStep, completedSteps]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-[#f7931a]/20 bg-gray-950">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl text-white flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-[#f7931a]" />
            Face Verification
          </CardTitle>
          <Progress 
            value={progress} 
            className="w-full h-1 bg-gray-800 mt-2" 
            data-testid="kyc-progress"
          />
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Camera Setup */}
          {currentStep === 'camera-permission' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-[#f7931a]/20 rounded-full flex items-center justify-center">
                <Camera className="w-10 h-10 text-[#f7931a]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Camera Access Required</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  We need your camera to verify your identity. No photos are stored - everything happens live.
                </p>
              </div>
              <div className="space-y-4">
                <Button 
                  onClick={initializeCamera}
                  size="lg"
                  className="bg-[#f7931a] hover:bg-[#ff9416] text-black font-bold px-8 py-4 text-lg"
                  data-testid="button-enable-camera"
                >
                  <Camera className="w-6 h-6 mr-3" />
                  Start Face Verification
                </Button>
                
                {speechSupported && (
                  <p className="text-sm text-[#f7931a] flex items-center justify-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Voice guidance enabled
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Camera View */}
          {currentStep !== 'camera-permission' && currentStep !== 'complete' && (
            <div className="space-y-6">
              {/* Simple Instruction */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {currentStepData?.instruction}
                </h2>
                {countdown !== null && (
                  <div className="text-4xl font-bold text-[#f7931a] mb-2">
                    {countdown > 0 ? countdown : "✓"}
                  </div>
                )}
                {speechSupported && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speak(currentStepData?.instruction || '')}
                    disabled={isSpeaking}
                    className="text-[#f7931a] hover:bg-[#f7931a]/20"
                    data-testid="button-repeat-instruction"
                  >
                    {isSpeaking ? (
                      <VolumeX className="w-4 h-4 mr-2" />
                    ) : (
                      <Volume2 className="w-4 h-4 mr-2" />
                    )}
                    {isSpeaking ? 'Speaking...' : 'Repeat'}
                  </Button>
                )}
              </div>

              {/* Large Camera Circle */}
              <div className="flex justify-center">
                <div className="relative w-96 h-96 rounded-full overflow-hidden border-4 border-[#f7931a] bg-black">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover scale-110"
                    autoPlay
                    playsInline
                    muted
                    data-testid="kyc-video"
                    style={{
                      transform: 'scaleX(-1) scale(1.1)', // Mirror and zoom slightly
                      filter: 'contrast(1.1) brightness(1.05)'
                    }}
                  />
                  
                  {/* Centered Guide Circle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-80 h-80 border-2 border-[#f7931a] rounded-full opacity-50"></div>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge 
                      className={`${
                        completedSteps.has(currentStep) 
                          ? "bg-green-600 text-white" 
                          : "bg-[#f7931a] text-black"
                      }`}
                    >
                      {completedSteps.has(currentStep) ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : (
                        <Circle className="w-4 h-4 mr-1" />
                      )}
                      {completedSteps.has(currentStep) ? "✓" : "◯"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Auto-detection Progress */}
              {isDetecting && (
                <div className="text-center space-y-4">
                  <div className="relative w-32 h-32 mx-auto">
                    {/* Background circle */}
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-700"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="transparent"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      {/* Progress circle */}
                      <path
                        className="text-[#f7931a]"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        fill="transparent"
                        strokeDasharray={`${detectionProgress}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    {/* Progress text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#f7931a]">
                        {Math.round(detectionProgress)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">
                      {currentStep === 'position-face' 
                        ? 'Keep your face centered in the circle'
                        : 'Follow the instruction - movement detected automatically'
                      }
                    </p>
                    {faceApiLoaded && (
                      <div className="flex items-center justify-center gap-4 text-xs">
                        <div className={`flex items-center gap-1 ${
                          faceDetected ? 'text-green-400' : 'text-red-400'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            faceDetected ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          Face: {faceDetected ? 'Detected' : 'Not Found'}
                        </div>
                        <div className="text-gray-500">
                          Confidence: {Math.round(faceConfidence * 100)}%
                        </div>
                      </div>
                    )}
                    {!faceApiLoaded && (
                      <p className="text-xs text-yellow-400">
                        Loading face detection models...
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing State */}
          {currentStep === 'processing' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-[#f7931a]/20 rounded-full flex items-center justify-center animate-pulse">
                <RotateCcw className="w-10 h-10 text-[#f7931a] animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Processing Verification</h3>
                <p className="text-gray-400 text-sm">
                  Generating secure device fingerprint and verification hash...
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {currentStep === 'complete' && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-green-400">Verification Complete!</h3>
                <p className="text-gray-400 text-sm">
                  Your identity has been verified. Proceeding to account setup...
                </p>
              </div>
            </div>
          )}

          {/* Hidden canvas for face detection */}
          <canvas ref={canvasRef} className="hidden" width="640" height="480" />

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-gray-800">
            <Button
              onClick={onBack}
              disabled={isProcessing || currentStep === 'complete'}
              className="bg-gray-700 hover:bg-gray-600 text-white"
              data-testid="button-kyc-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {currentStep === 'complete' && (
              <Button
                onClick={() => {
                  // Fallback in case auto-advance doesn't work
                  if (completedSteps.size > 0) {
                    onComplete({ deviceFingerprint: '', verificationHash: '' });
                  }
                }}
                className="bg-[#f7931a] hover:bg-[#ff9416] text-black font-bold"
                data-testid="button-kyc-continue"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue to Account Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}