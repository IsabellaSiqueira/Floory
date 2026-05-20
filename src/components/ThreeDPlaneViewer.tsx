import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as fflate from 'fflate';
import { Upload, RotateCcw, AlertTriangle, Check, Loader2, Sparkles, HelpCircle } from 'lucide-react';

// Register fflate globally to make sure FBXLoader can resolve zip compression seamlessly
if (typeof window !== 'undefined' && !(window as any).fflate) {
  (window as any).fflate = fflate;
}

export interface ThreeDPlaneViewerProps {
  visualStyle?: 'original' | 'chrome' | 'xray';
  lightingMode?: 'hangar' | 'aurora' | 'sunset';
  hideControls?: boolean;
}

export const ThreeDPlaneViewer = ({
  visualStyle: externalStyle,
  lightingMode: externalLighting,
  hideControls = false
}: ThreeDPlaneViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bespoke Studio Interactive Customization States
  const [visualStyle, setVisualStyle] = useState<'original' | 'chrome' | 'xray'>('original');
  const [lightingMode, setLightingMode] = useState<'hangar' | 'aurora' | 'sunset'>('hangar');

  // Custom Model Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customModelInfo, setCustomModelInfo] = useState<{ name: string; size: string; meshCount: number } | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Sync props to state if provided externally
  useEffect(() => {
    if (externalStyle) {
      setVisualStyle(externalStyle);
    }
  }, [externalStyle]);

  useEffect(() => {
    if (externalLighting) {
      setLightingMode(externalLighting);
    }
  }, [externalLighting]);

  const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());

  // Keep references for interaction and animation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const lastInteractionTimeRef = useRef<number>(Date.now());
  const isInteractingRef = useRef<boolean>(false);

  // States for dynamic camera orbit HUD
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [autoRotateSpeedState, setAutoRotateSpeedState] = useState<number>(1);
  const [showNavHelp, setShowNavHelp] = useState<boolean>(false);

  // Internal fast references for animation thread updates
  const autoRotateRef = useRef<boolean>(true);
  const autoRotateSpeedRef = useRef<number>(1);

  // Sync states to fast references immediately when changed
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    autoRotateSpeedRef.current = autoRotateSpeedState;
  }, [autoRotateSpeedState]);

  // Store standard jet generator so we can reset
  const buildProceduralJetRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera Setup
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 3.2); // Starting zoom for visual impact
    cameraRef.current = camera;

    // 3. Renderer Setup (with transparency and high-specular ACES Tone-mapping)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3b. OrbitControls Setup for supreme 3D navigation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.25;
    controls.maxDistance = 6.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.target.set(0, -0.15, 0);
    controls.update();
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      isInteractingRef.current = true;
    });

    controls.addEventListener('end', () => {
      isInteractingRef.current = false;
      lastInteractionTimeRef.current = Date.now();
    });

    // 4. Studio Showroom Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x111827, 0.8);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 3.5); // Primary studio light
    directionalLight1.position.set(5, 10, 7);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = 1024;
    directionalLight1.shadow.mapSize.height = 1024;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x3b82f6, 1.5); // Secondary fill
    directionalLight2.position.set(-5, -3, -5);
    scene.add(directionalLight2);

    const pointLight = new THREE.PointLight(0xffffff, 1.5, 100);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // Showroom glossy floor ring helper
    const ringGeometry = new THREE.RingGeometry(2.8, 3.0, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x9333ea, 
      side: THREE.DoubleSide, 
      transparent: true, 
      opacity: 0.15 
    });
    const floorRing = new THREE.Mesh(ringGeometry, ringMaterial);
    floorRing.rotation.x = Math.PI / 2;
    floorRing.position.y = -1.8;
    scene.add(floorRing);

    // 5. Model Group Setup
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // 6. Build High-Fidelity Procedural Bombardier Jet Representation
    const buildProceduralJet = () => {
      // Clear previous custom model if any
      while(modelGroup.children.length > 0){
        modelGroup.remove(modelGroup.children[0]);
      }

      // Restore default rotation
      modelGroup.rotation.set(0, 0, 0);

      // Main Airplane Group
      const planeGroup = new THREE.Group();

      // Fuselage Material (Metallic violet-chrome)
      const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x2e1065,
        metalness: 0.95,
        roughness: 0.08,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });

      // Airfoil details (Neon Purple highlight edges)
      const detailMaterial = new THREE.MeshStandardMaterial({
        color: 0x9333ea,
        emissive: 0xa855f7,
        emissiveIntensity: 0.4,
        metalness: 0.9,
        roughness: 0.1
      });

      // Gold-brass finish for exhaust / highlights
      const goldMaterial = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        metalness: 0.95,
        roughness: 0.1
      });

      // 6a. Fuselage
      const fuselageGeom = new THREE.CylinderGeometry(0.32, 0.28, 4.8, 16);
      fuselageGeom.rotateX(Math.PI / 2);
      const fuselage = new THREE.Mesh(fuselageGeom, metalMaterial);
      planeGroup.add(fuselage);

      // Nose cone
      const noseGeom = new THREE.ConeGeometry(0.32, 0.9, 16);
      noseGeom.rotateX(-Math.PI / 2);
      noseGeom.translate(0, 0, 2.85);
      const nose = new THREE.Mesh(noseGeom, detailMaterial);
      planeGroup.add(nose);

      // Tail cone
      const tailGeom = new THREE.ConeGeometry(0.28, 1.2, 16);
      tailGeom.rotateX(Math.PI / 2);
      tailGeom.translate(0, 0, -3.0);
      const tail = new THREE.Mesh(tailGeom, metalMaterial);
      planeGroup.add(tail);

      // 6b. Left Wing (Sleek delta sweep)
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(-3.8, -1.8);
      wingShape.lineTo(-3.7, -2.1);
      wingShape.lineTo(0, -0.8);
      wingShape.lineTo(0, 0);

      const wingExtrudeSettings = { depth: 0.03, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.01, bevelThickness: 0.01 };
      const leftWingGeom = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
      leftWingGeom.rotateX(Math.PI / 2);
      leftWingGeom.translate(0, 0, 0.4);
      const leftWing = new THREE.Mesh(leftWingGeom, metalMaterial);
      planeGroup.add(leftWing);

      // Left Winglet (Dynamic angle)
      const wingletGeom = new THREE.ConeGeometry(0.06, 0.5, 4);
      wingletGeom.rotateZ(Math.PI / 5);
      wingletGeom.translate(-3.8, 0.2, -1.5);
      const leftWinglet = new THREE.Mesh(wingletGeom, detailMaterial);
      planeGroup.add(leftWinglet);

      // 6c. Right Wing (Symmetric sweep)
      const rightWingShape = new THREE.Shape();
      rightWingShape.moveTo(0, 0);
      rightWingShape.lineTo(3.8, -1.8);
      rightWingShape.lineTo(3.7, -2.1);
      rightWingShape.lineTo(0, -0.8);
      rightWingShape.lineTo(0, 0);

      const rightWingGeom = new THREE.ExtrudeGeometry(rightWingShape, wingExtrudeSettings);
      rightWingGeom.rotateX(Math.PI / 2);
      rightWingGeom.translate(0, 0, 0.4);
      const rightWing = new THREE.Mesh(rightWingGeom, metalMaterial);
      planeGroup.add(rightWing);

      // Right Winglet
      const rightWingletGeom = new THREE.ConeGeometry(0.06, 0.5, 4);
      rightWingletGeom.rotateZ(-Math.PI / 5);
      rightWingletGeom.translate(3.8, 0.2, -1.5);
      const rightWinglet = new THREE.Mesh(rightWingletGeom, detailMaterial);
      planeGroup.add(rightWinglet);

      // 6d. Horizontal Stabilizers (Tail wings)
      const tailWingShape = new THREE.Shape();
      tailWingShape.moveTo(0, 0);
      tailWingShape.lineTo(-1.2, -0.4);
      tailWingShape.lineTo(-1.1, -0.6);
      tailWingShape.lineTo(0, -0.2);

      const leftTailGeom = new THREE.ExtrudeGeometry(tailWingShape, wingExtrudeSettings);
      leftTailGeom.rotateX(Math.PI / 2);
      leftTailGeom.translate(0, 1.4, -2.5);
      const leftTail = new THREE.Mesh(leftTailGeom, metalMaterial);
      planeGroup.add(leftTail);

      const rightTailWingShape = new THREE.Shape();
      rightTailWingShape.moveTo(0, 0);
      rightTailWingShape.lineTo(1.2, -0.4);
      rightTailWingShape.lineTo(1.1, -0.6);
      rightTailWingShape.lineTo(0, -0.2);

      const rightTailGeom = new THREE.ExtrudeGeometry(rightTailWingShape, wingExtrudeSettings);
      rightTailGeom.rotateX(Math.PI / 2);
      rightTailGeom.translate(0, 1.4, -2.5);
      const rightTail = new THREE.Mesh(rightTailGeom, metalMaterial);
      planeGroup.add(rightTail);

      // 6e. Vertical Stabilizer (Fin)
      const finShape = new THREE.Shape();
      finShape.moveTo(0, 0);
      finShape.lineTo(0, 1.5);
      finShape.lineTo(-0.4, 1.3);
      finShape.lineTo(-0.9, 0);

      const finGeom = new THREE.ExtrudeGeometry(finShape, { depth: 0.04, bevelEnabled: true, bevelSize: 0.01 });
      finGeom.translate(0, 0.2, -2.4);
      const fin = new THREE.Mesh(finGeom, metalMaterial);
      planeGroup.add(fin);

      // 6f. Rear Jet Engines (Double mounted rear-fuselage)
      const engineGeom = new THREE.CylinderGeometry(0.18, 0.15, 1.1, 12);
      engineGeom.rotateX(Math.PI / 2);

      // Inside engine exhaust glow
      const exhaustGeom = new THREE.CylinderGeometry(0.13, 0.13, 0.1, 12);
      exhaustGeom.rotateX(Math.PI / 2);

      // Left Engine
      const leftEngine = new THREE.Mesh(engineGeom, metalMaterial);
      leftEngine.position.set(-0.45, 0.2, -1.8);
      const leftExhaust = new THREE.Mesh(exhaustGeom, goldMaterial);
      leftExhaust.position.set(-0.45, 0.2, -2.36);
      planeGroup.add(leftEngine);
      planeGroup.add(leftExhaust);

      // Right Engine
      const rightEngine = new THREE.Mesh(engineGeom, metalMaterial);
      rightEngine.position.set(0.45, 0.2, -1.8);
      const rightExhaust = new THREE.Mesh(exhaustGeom, goldMaterial);
      rightExhaust.position.set(0.45, 0.2, -2.36);
      planeGroup.add(rightEngine);
      planeGroup.add(rightExhaust);

      // Scale and reposition airplane to center beautifully
      planeGroup.scale.set(0.85, 0.85, 0.85);
      planeGroup.position.set(0, -0.2, 0);
      modelGroup.add(planeGroup);

      // Record original materials
      originalMaterialsRef.current.clear();
      planeGroup.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          originalMaterialsRef.current.set(node, node.material);
        }
      });
    };

    buildProceduralJetRef.current = buildProceduralJet;
    buildProceduralJet();

    // 8. Animation & Render Loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      if (modelGroup) {
        // Subtle levitation/floating flow on Y axis
        modelGroup.position.y = Math.sin(Date.now() * 0.001) * 0.04;
      }

      const now = Date.now();
      const timeSinceInteraction = now - lastInteractionTimeRef.current;

      // Integrate OrbitControls auto-rotation & state updates
      if (controlsRef.current) {
        if (autoRotateRef.current && !isInteractingRef.current && timeSinceInteraction > 3000) {
          controlsRef.current.autoRotate = true;
          // Sync speed setting
          controlsRef.current.autoRotateSpeed = autoRotateSpeedRef.current * 1.5;
        } else {
          controlsRef.current.autoRotate = false;
        }
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, []);

  const updateStyleAndLighting = (style: 'original' | 'chrome' | 'xray', mode: 'hangar' | 'aurora' | 'sunset') => {
    // 1. Update Lights dynamically on the active scene
    if (sceneRef.current) {
      const lights = sceneRef.current.children.filter(child => child instanceof THREE.Light);
      
      const ambient = lights.find(l => l instanceof THREE.AmbientLight) as THREE.AmbientLight;
      const point = lights.find(l => l instanceof THREE.PointLight) as THREE.PointLight;
      const directionals = lights.filter(l => l instanceof THREE.DirectionalLight) as THREE.DirectionalLight[];

      if (mode === 'hangar') {
        if (ambient) {
          ambient.color.setHex(0xffffff);
          ambient.intensity = 1.0;
        }
        if (point) {
          point.color.setHex(0xffffff);
          point.intensity = 1.5;
        }
        if (directionals[0]) {
          directionals[0].color.setHex(0xffffff);
          directionals[0].position.set(5, 10, 7);
          directionals[0].intensity = 3.5;
        }
        if (directionals[1]) {
          directionals[1].color.setHex(0x3b82f6); // Neutral blue contrast fill
          directionals[1].position.set(-5, -3, -5);
          directionals[1].intensity = 1.5;
        }
      } else if (mode === 'aurora') {
        if (ambient) {
          ambient.color.setHex(0x111827);
          ambient.intensity = 0.4;
        }
        if (point) {
          point.color.setHex(0xa855f7);
          point.intensity = 3.0;
        }
        if (directionals[0]) {
          directionals[0].color.setHex(0xa855f7); // Deep luxury purple spot
          directionals[0].position.set(5, 8, 5);
          directionals[0].intensity = 4.0;
        }
        if (directionals[1]) {
          directionals[1].color.setHex(0x10b981); // Emerald scanner fill
          directionals[1].position.set(-5, 2, -5);
          directionals[1].intensity = 2.8;
        }
      } else if (mode === 'sunset') {
        if (ambient) {
          ambient.color.setHex(0x7c2d12);
          ambient.intensity = 0.6;
        }
        if (point) {
          point.color.setHex(0xfb923c);
          point.intensity = 2.5;
        }
        if (directionals[0]) {
          directionals[0].color.setHex(0xf59e0b); // Warm amber spot
          directionals[0].position.set(8, 5, 5);
          directionals[0].intensity = 5.0;
        }
        if (directionals[1]) {
          directionals[1].color.setHex(0xdb2777); // Pink/Magenta sunset fill
          directionals[1].position.set(-8, -2, -5);
          directionals[1].intensity = 2.0;
        }
      }
    }

    // 2. Update Mesh Materials on active modelGroup
    if (modelGroupRef.current) {
      modelGroupRef.current.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          const original = originalMaterialsRef.current.get(node);
          
          if (style === 'original' && original) {
            node.material = original;
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.metalness = Math.max(mat.metalness, 0.45);
                mat.roughness = Math.min(mat.roughness, 0.35);
                mat.side = THREE.DoubleSide;
                mat.needsUpdate = true;
              }
            });
          } else if (style === 'chrome') {
            node.material = new THREE.MeshStandardMaterial({
              color: 0x2e1065, // Floory luxury deep purple chrome
              emissive: 0x07000f,
              metalness: 0.98,
              roughness: 0.05,
              side: THREE.DoubleSide
            });
          } else if (style === 'xray') {
            node.material = new THREE.MeshStandardMaterial({
              color: 0x10b981,
              emissive: 0x064e3b,
              wireframe: true,
              transparent: true,
              opacity: 0.4,
              side: THREE.DoubleSide
            });
          }
        }
      });
    }
  };

  useEffect(() => {
    updateStyleAndLighting(visualStyle, lightingMode);
  }, [visualStyle, lightingMode]);

  // Normalization logic: auto-scales and centers any uploaded model beautifully inside the showroom boundaries
  const centerAndNormalizeModel = (object: THREE.Object3D) => {
    // Force compute bounding box
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    // Position object center at origin (0,0,0) with a slight default lift
    object.position.x = -center.x;
    object.position.y = -center.y - 0.1;
    object.position.z = -center.z;
    
    // Scale object to fit nice showroom boundaries (target absolute major dimension of 2.2 units)
    const maxDim = Math.max(size.x, size.y, size.z);
    const desiredMajorDimension = 2.4; 
    if (maxDim > 0) {
      const scaleFactor = desiredMajorDimension / maxDim;
      object.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
  };

  // Preprocessor for FBX models to fix/heal header casing and version number issues (THREE.FBXLoader error)
  const preprocessFBXFile = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const bytes = new Uint8Array(buffer);

          // 1. Search for binary signature "Kaydara FBX Binary" to see if it is binary format
          const sig = "Kaydara FBX Binary";
          const sigBytes = Array.from(sig).map(c => c.charCodeAt(0));
          
          let foundOffset = -1;
          for (let i = 0; i <= Math.min(bytes.length - sigBytes.length, 2500); i++) {
            let match = true;
            for (let j = 0; j < sigBytes.length; j++) {
              if (bytes[i + j] !== sigBytes[j]) {
                match = false;
                break;
              }
            }
            if (match) {
              foundOffset = i;
              break;
            }
          }

          if (foundOffset >= 0) {
            console.log(`[FBX Healer] Found Binary signature 'Kaydara' at offset: ${foundOffset}`);
            // Recut buffer if offset is shifted
            let activeBuffer = buffer;
            if (foundOffset > 0) {
              activeBuffer = buffer.slice(foundOffset);
            }
            
            // Overwrite first 21 bytes to be 100% compliant: "Kaydara FBX Binary  \0"
            const targetBytes = new Uint8Array(activeBuffer);
            const verifiedSig = [
              0x4b, 0x61, 0x79, 0x64, 0x61, 0x72, 0x61, 0x20, // "Kaydara "
              0x46, 0x42, 0x58, 0x20,                         // "FBX "
              0x42, 0x69, 0x6e, 0x61, 0x72, 0x79,             // "Binary"
              0x20, 0x20, 0x00                                // "  \0"
            ];
            for (let k = 0; k < verifiedSig.length; k++) {
              if (k < targetBytes.length) {
                targetBytes[k] = verifiedSig[k];
              }
            }
            
            resolve(new File([activeBuffer], file.name, { type: "model/fbx" }));
            return;
          }

          // 2. ASCII format: sanitize FBXVersion keyword casing
          const decoder = new TextDecoder("utf-8");
          let fbxText = decoder.decode(bytes);
          
          const versionRegex = /FBXVersion:\s*(\d+)/i;
          const match = fbxText.match(versionRegex);
          
          if (match) {
            const currentMatch = match[0];
            const versionVal = match[1];
            const correctString = `FBXVersion: ${versionVal}`;
            
            if (currentMatch !== correctString) {
              console.log(`[FBX Healer] Adjusting ASCII FBXVersion from "${currentMatch}" to "${correctString}"`);
              fbxText = fbxText.replace(/FBXVersion:\s*\d+/gi, correctString);
            }
          } else {
            console.log("[FBX Healer] Prepending default FBXVersion tag to ASCII FBX to satisfy standard Three.js FBXLoader");
            fbxText = `; Auto-repaired by ThreeDPlaneViewer\nFBXVersion: 7400\n\n` + fbxText;
          }

          const encoder = new TextEncoder();
          const repairedBytes = encoder.encode(fbxText);
          resolve(new File([repairedBytes], file.name, { type: "model/fbx" }));
        } catch (err) {
          console.error("[FBX Healer] Failed to preprocess FBX, loading raw file:", err);
          resolve(file);
        }
      };
      
      reader.onerror = () => resolve(file);
      reader.readAsArrayBuffer(file);
    });
  };

  // Core file loading processor
  const handleFileUpload = async (file: File) => {
    if (!modelGroupRef.current || !sceneRef.current) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['gltf', 'glb', 'fbx'].includes(extension)) {
      setLoadError("Formato não suportado. Envie um arquivo no formato .glb, .gltf ou .fbx.");
      return;
    }

    setIsLoading(true);
    setLoadingProgress(0);
    setLoadError(null);

    try {
      let activeFile = file;

      // FBX Preprocessing for extreme durability (remedies "Cannot find the version number for the file given" crash)
      if (extension === 'fbx') {
        setLoadingProgress(15);
        activeFile = await preprocessFBXFile(file);
        setLoadingProgress(30);
      }

      const manager = new THREE.LoadingManager();
      manager.onProgress = (_, itemsLoaded, itemsTotal) => {
        const percentage = Math.round((itemsLoaded / itemsTotal) * 100);
        // Map remaining progress from 30% to 90%
        setLoadingProgress(30 + Math.round(percentage * 0.6));
      };

      const objectUrl = URL.createObjectURL(activeFile);

      // Perform actual 3D Loading
      if (extension === 'fbx') {
        const loader = new FBXLoader(manager);
        loader.load(objectUrl, (fbxGroup) => {
          // Success callback
          URL.revokeObjectURL(objectUrl);
          
          // Clear active geometries
          while (modelGroupRef.current!.children.length > 0) {
            modelGroupRef.current!.remove(modelGroupRef.current!.children[0]);
          }

          // Normalize
          centerAndNormalizeModel(fbxGroup);

          // Add to model group
          modelGroupRef.current!.add(fbxGroup);

          // Store for visual properties shifting (Standard/Chrome/XRay)
          originalMaterialsRef.current.clear();
          let meshCounter = 0;
          fbxGroup.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              meshCounter++;
              originalMaterialsRef.current.set(node, node.material);
            }
          });

          // Sync lighting materials
          updateStyleAndLighting(visualStyle, lightingMode);

          // Compute pretty metadata info
          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
          setCustomModelInfo({
            name: file.name,
            size: `${sizeMB} MB`,
            meshCount: meshCounter
          });
          setIsLoading(false);
          setLoadingProgress(100);
        }, 
        undefined, 
        (error: any) => {
          console.error("FBX loading failed:", error);
          URL.revokeObjectURL(objectUrl);
          setLoadError(`Não foi possível carregar o arquivo FBX. Detalhe: ${error.message || 'Erro interno na geometria'}. Certifique-se de exportá-lo como 'FBX Binary' na versão 'FBX 2020' no Maya 2026.`);
          setIsLoading(false);
        });

      } else {
        // GLTF / GLB Loader
        const loader = new GLTFLoader(manager);
        loader.load(objectUrl, (gltf) => {
          // Success callback
          URL.revokeObjectURL(objectUrl);
          
          while (modelGroupRef.current!.children.length > 0) {
            modelGroupRef.current!.remove(modelGroupRef.current!.children[0]);
          }

          const gltfScene = gltf.scene;
          
          // Normalize
          centerAndNormalizeModel(gltfScene);

          // Add to model group
          modelGroupRef.current!.add(gltfScene);

          // Store materials
          originalMaterialsRef.current.clear();
          let meshCounter = 0;
          gltfScene.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              meshCounter++;
              originalMaterialsRef.current.set(node, node.material);
            }
          });

          updateStyleAndLighting(visualStyle, lightingMode);

          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
          setCustomModelInfo({
            name: file.name,
            size: `${sizeMB} MB`,
            meshCount: meshCounter
          });
          setIsLoading(false);
          setLoadingProgress(100);
        },
        undefined,
        (error: any) => {
          console.error("GLTF loading failed:", error);
          URL.revokeObjectURL(objectUrl);
          setLoadError(`Não foi possível carregar o arquivo GLTF. Detalhe: ${error.message || 'Estrutura inválida'}.`);
          setIsLoading(false);
        });
      }

    } catch (err: any) {
      console.error("Model load wrapper failure:", err);
      setLoadError(`Erro crítico ao carregar: ${err.message || 'Falha desconhecida'}`);
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleResetToDefault = () => {
    if (buildProceduralJetRef.current) {
      buildProceduralJetRef.current();
      setCustomModelInfo(null);
      setLoadError(null);
      updateStyleAndLighting(visualStyle, lightingMode);

      // Reset camera and controls to default perspective
      if (controlsRef.current && cameraRef.current) {
        controlsRef.current.target.set(0, -0.15, 0);
        cameraRef.current.position.set(0, 0.4, 3.2);
        controlsRef.current.update();
      }
    }
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center relative touch-none select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input for trigger */}
      <input 
        ref={fileInputRef}
        id="three-d-file-input"
        type="file" 
        accept=".glb,.gltf,.fbx"
        onChange={handleFileChange}
        className="hidden" 
      />

      {/* 3D Canvas Container */}
      <div 
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden flex items-center justify-center"
      >
        {/* Dynamic scanning laser glow lines overlay mirroring tunnel */}
        <div className="absolute inset-0 xray-mesh opacity-10 pointer-events-none" />

        {/* Drag & Drop Overlay Visual State */}
        {isDraggingOver && (
          <div className="absolute inset-4 rounded-3xl z-40 bg-purple-950/40 backdrop-blur-md border border-dashed border-purple-500/50 flex flex-col justify-center items-center gap-3 animate-pulse pointer-events-none">
            <Upload className="w-10 h-10 text-purple-400" />
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">Soltar Modelo Customizado</h3>
            <p className="text-[10px] text-white/60 font-mono">Suporta formatos .glb, .gltf ou .fbx</p>
          </div>
        )}

        {/* Loading HUD Screen Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-30 flex flex-col justify-center items-center gap-4">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <div className="absolute text-[9px] font-bold text-white font-mono">{loadingProgress}%</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white font-mono">Importando Geometria</h3>
              <p className="text-[9px] text-purple-300 font-mono animate-pulse">Prevenindo desvios e alinhando marcadores de versão...</p>
            </div>
          </div>
        )}

        {/* Load Error Banner Popup */}
        {loadError && (
          <div className="absolute mx-6 top-24 left-4 right-4 bg-red-950/90 border border-red-500/30 p-4 rounded-2xl backdrop-blur-md z-20 flex items-start gap-4 select-text">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 flex flex-col gap-1.5 align-left text-left">
              <h4 className="text-[10px] font-black uppercase text-red-200 tracking-wider font-mono">Erro de Leitura 3D</h4>
              <p className="text-[9px] text-red-300 font-mono leading-relaxed">{loadError}</p>
              <div className="flex gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 font-bold font-mono text-[8px] uppercase tracking-wider rounded-md text-red-200 cursor-pointer"
                >
                  Tentar Outro
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 font-bold font-mono text-[8px] uppercase tracking-wider rounded-md text-white/80 cursor-pointer"
                >
                  Usar Aeronave Padrão
                </button>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setLoadError(null)} 
              className="text-red-400 hover:text-red-200 text-xs shrink-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Custom Loaded Design Badge Panel (Success Details) */}
        {customModelInfo && !isLoading && (
          <div className="absolute top-24 right-4 bg-black/40 border border-purple-500/20 hover:border-purple-500/40 p-3 rounded-2xl backdrop-blur-md z-10 flex flex-col gap-2 w-[220px] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] uppercase tracking-wider font-bold text-white/90 font-mono">Design Ativo</span>
              </div>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="flex items-center gap-1 text-[8px] text-purple-300 hover:text-white transition-colors cursor-pointer"
                title="Voltar ao Bombardier Jet executivo padrão"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Restaurar Padrão</span>
              </button>
            </div>
            <div className="flex flex-col gap-1 border-t border-white/5 pt-1.5 align-left text-left">
              <span className="text-[9px] font-medium text-white/80 truncate font-mono" title={customModelInfo.name}>{customModelInfo.name}</span>
              <div className="flex justify-between items-center text-[8px] text-white/50 font-mono">
                <span>Tamanho: {customModelInfo.size}</span>
                <span>Malha: {customModelInfo.meshCount} meshes</span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Studio Customization Controller Panel */}
        {!hideControls && (
          <div className="absolute bottom-4 left-4 flex flex-col gap-3.5 pointer-events-auto bg-black/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 w-[250px] z-10 select-none">
            {/* Quick Upload Action */}
            <div className="flex flex-col gap-1.5 pb-2.5 border-b border-white/5">
              <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-light block mb-1 font-mono text-left">Sua Geometria</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-purple-500/20 hover:bg-purple-500/35 active:scale-95 border border-purple-500/30 rounded-full text-[8px] uppercase tracking-widest font-black transition-all text-purple-200 hover:text-white cursor-pointer"
              >
                <Upload className="w-3 h-3 text-purple-400 animate-pulse" />
                <span>Substituir Modelo (.glb/.gltf/.fbx)</span>
              </button>
            </div>

            <div>
              <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-light block mb-2 font-mono text-left">Acabamento Executivo</span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setVisualStyle('original')}
                  className={`text-[8px] font-medium py-1 px-2 rounded-full transition-all duration-300 cursor-pointer text-center ${visualStyle === 'original' ? 'ring-1 ring-purple-500/50 text-purple-200 bg-purple-500/5' : 'text-white/40 hover:text-white/75'}`}
                >
                  Original PBR
                </button>
                <button
                  type="button"
                  onClick={() => setVisualStyle('chrome')}
                  className={`text-[8px] font-medium py-1 px-2 rounded-full transition-all duration-300 cursor-pointer text-center ${visualStyle === 'chrome' ? 'ring-1 ring-purple-500/50 text-purple-200 bg-purple-500/5' : 'text-white/40 hover:text-white/75'}`}
                >
                  Violet Chrome
                </button>
                <button
                  type="button"
                  onClick={() => setVisualStyle('xray')}
                  className={`text-[8px] font-medium py-1 px-2 rounded-full transition-all duration-300 cursor-pointer text-center ${visualStyle === 'xray' ? 'ring-1 ring-purple-500/50 text-purple-200 bg-purple-500/5' : 'text-white/40 hover:text-white/75'}`}
                >
                  Túnel Vento
                </button>
              </div>
            </div>
            
            <div className="border-t border-white/5 pt-2.5">
              <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-light block mb-2 font-mono text-left">Iluminação Hangar</span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setLightingMode('hangar')}
                  className={`text-[8px] font-medium py-1 px-2 rounded-full transition-all duration-300 cursor-pointer text-center ${lightingMode === 'hangar' ? 'ring-1 ring-emerald-500/50 text-emerald-200 bg-emerald-500/5' : 'text-white/40 hover:text-white/75'}`}
                >
                  VIP Hangar
                </button>
                <button
                  type="button"
                  onClick={() => setLightingMode('aurora')}
                  className={`text-[8px] font-medium py-1 px-2 rounded-full transition-all duration-300 cursor-pointer text-center ${lightingMode === 'aurora' ? 'ring-1 ring-emerald-500/50 text-emerald-200 bg-emerald-500/5' : 'text-white/40 hover:text-white/75'}`}
                >
                  Cosmic Laser
                </button>
                <button
                  type="button"
                  onClick={() => setLightingMode('sunset')}
                  className={`text-[8px] font-medium py-1 px-2 rounded-full transition-all duration-300 cursor-pointer text-center ${lightingMode === 'sunset' ? 'ring-1 ring-emerald-500/50 text-emerald-200 bg-emerald-500/5' : 'text-white/40 hover:text-white/75'}`}
                >
                  Sunset Gold
                </button>
              </div>
            </div>
          </div>
        )}

        {/* High-fidelity Orbit Controller Floating HUD (Always visible for luxury exploration) */}
        <div className="absolute right-4.5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5 z-20 pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] animate-fade-in">
          {/* RESET BUTTON */}
          <button
            type="button"
            onClick={() => {
              lastInteractionTimeRef.current = Date.now();
              if (controlsRef.current && cameraRef.current) {
                controlsRef.current.target.set(0, -0.15, 0);
                cameraRef.current.position.set(0, 0.4, 3.2);
                controlsRef.current.update();
              }
            }}
            className="group relative w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-300 text-white/75 active:scale-90 transition-all cursor-pointer"
            title="Resetar Câmera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="absolute right-10 top-1/2 -translate-y-1/2 bg-black/95 text-[8px] uppercase tracking-wider font-bold font-mono text-white px-2 px-2.5 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
              Resetar Câmera
            </span>
          </button>

          {/* AUTO-ROTATE TOGGLE BUTTON */}
          <button
            type="button"
            onClick={() => {
              lastInteractionTimeRef.current = Date.now();
              setAutoRotate(!autoRotate);
            }}
            className={`group relative w-8 h-8 flex items-center justify-center rounded-xl border active:scale-90 transition-all cursor-pointer ${
              autoRotate 
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30' 
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
            }`}
            title={autoRotate ? "Pausar Auto-Rotação" : "Iniciar Auto-Rotação"}
          >
            {autoRotate ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            )}
            <span className="absolute right-10 top-1/2 -translate-y-1/2 bg-black/95 text-[8px] uppercase tracking-wider font-bold font-mono text-white px-2.5 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
              {autoRotate ? "Pausar Giro" : "Auto-Giro Ativo"}
            </span>
          </button>

          {/* AUTO-ROTATE SPEED TOGGLE */}
          {autoRotate && (
            <button
              type="button"
              onClick={() => {
                lastInteractionTimeRef.current = Date.now();
                setAutoRotateSpeedState(prev => prev === 0.5 ? 1 : prev === 1 ? 2 : 0.5);
              }}
              className="group relative w-8 h-8 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/20 hover:text-purple-300 text-[8.5px] font-black font-mono text-purple-200 active:scale-90 transition-all cursor-pointer"
              title="Ajustar Velocidade"
            >
              <span>{autoRotateSpeedState}x</span>
              <span className="absolute right-10 top-1/2 -translate-y-1/2 bg-black/95 text-[8px] uppercase tracking-wider font-bold font-mono text-white px-2.5 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                Velocidade: {autoRotateSpeedState}x
              </span>
            </button>
          )}

          <div className="w-4 h-[1px] bg-white/10 my-0.5" />

          {/* INTERACTIVE NAVIGATION HELP BUTTON */}
          <button
            type="button"
            onClick={() => setShowNavHelp(!showNavHelp)}
            className={`group relative w-8 h-8 flex items-center justify-center rounded-xl border active:scale-90 transition-all cursor-pointer ${
              showNavHelp 
                ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]' 
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="absolute right-10 top-1/2 -translate-y-1/2 bg-black/95 text-[8px] uppercase tracking-wider font-bold font-mono text-white px-2.5 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
              Ajuda de Controle
            </span>
          </button>

          {/* Floating Navigation Tutorial overlay when toggled */}
          {showNavHelp && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-black/95 backdrop-blur-2xl border border-white/15 p-4 rounded-2xl w-[220px] text-left shadow-2xl animate-fade-in transition-all">
              <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-white/10">
                <span className="text-[9px] font-black uppercase tracking-widest text-purple-300 font-mono">Navegação 3D</span>
                <button 
                  onClick={() => setShowNavHelp(false)}
                  className="text-[9px] text-white/40 hover:text-white hover:bg-white/10 w-4.5 h-4.5 rounded-full flex items-center justify-center transition-colors font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2.5 text-[8.5px] font-mono leading-relaxed text-white/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 py-0.5 bg-white/10 text-center rounded text-white/70 font-bold uppercase tracking-wide">Girar</div>
                  <span>Arrastar com Botão Esquerdo</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 py-0.5 bg-white/10 text-center rounded text-white/70 font-bold uppercase tracking-wide">Zoom</div>
                  <span>Rolar rodinha do mouse</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 py-0.5 bg-white/10 text-center rounded text-white/70 font-bold uppercase tracking-wide">Inércia</div>
                  <span>Velocidade desacelera ao soltar</span>
                </div>
                <p className="text-[7.5px] text-purple-400 font-sans pt-1 leading-snug">
                  ✨ O giro automático pausa ao arrastar e retoma após 3 segundos de inatividade.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
