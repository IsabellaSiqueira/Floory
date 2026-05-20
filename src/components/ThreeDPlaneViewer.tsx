import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as fflate from 'fflate';
import { Upload, HelpCircle, Activity, RefreshCw } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLoadedCustom, setHasLoadedCustom] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Bespoke Studio Interactive Customization States
  const [visualStyle, setVisualStyle] = useState<'original' | 'chrome' | 'xray'>('original');
  const [lightingMode, setLightingMode] = useState<'hangar' | 'aurora' | 'sunset'>('hangar');

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
  const particlesRef = useRef<THREE.Points | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Mouse interaction state
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera Setup
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 3.2); // Aggressive starting zoom for maximum visual impact & scale compensation (analogous to 1m camera orbit)
    cameraRef.current = camera;

    // 3. Renderer Setup (with transparency and high-specular ACES Tone-mapping for bespoke av-aesthetics)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

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
      opacity: 0.2 
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

    buildProceduralJet();

    // 8. Animation & Render Loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      if (modelGroup) {
        // Subtle levitation/floating flow on position Y instead of rotation to avoid overriding drag quaternion
        modelGroup.position.y = Math.sin(Date.now() * 0.001) * 0.04;
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
                // Keep original map configurations but tune specular gloss for bespoke feel!
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

  // Mouse drag handler for rotating plane
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = {
      x: e.clientX,
      y: e.clientY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !modelGroupRef.current) return;

    const deltaMove = {
      x: e.clientX - previousMousePosition.current.x,
      y: e.clientY - previousMousePosition.current.y
    };

    // Premium quaternion-based orbital dragging: rotates around screen X and Y axes perfectly for zero gimbal-lock
    const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaMove.y * 0.006);
    const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaMove.x * 0.006);
    modelGroupRef.current.quaternion.premultiply(qY).premultiply(qX);

    previousMousePosition.current = {
      x: e.clientX,
      y: e.clientY
    };
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  // Touch handlers for perfect fluid mobile/tablet finger-dragging orbit rotation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      previousMousePosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !modelGroupRef.current || e.touches.length !== 1) return;

    const deltaMove = {
      x: e.touches[0].clientX - previousMousePosition.current.x,
      y: e.touches[0].clientY - previousMousePosition.current.y
    };

    // Premium quaternion-based orbital dragging: rotates around screen X and Y axes perfectly for zero gimbal-lock
    const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaMove.y * 0.006);
    const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaMove.x * 0.006);
    modelGroupRef.current.quaternion.premultiply(qY).premultiply(qX);

    previousMousePosition.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Zoom control using mouse wheel (simulating model-viewer zoom and boundaries)
  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    const zoomFactor = 0.08;
    const direction = e.deltaY > 0 ? 1 : -1;
    
    // Zoom in/out with boundary constraints to prevent model from disappearing or clipping
    const minZ = 1.0; // Close inspection zoom boundary
    const maxZ = 7.0; // Distance boundary
    
    let newZ = cameraRef.current.position.z + direction * zoomFactor * Math.max(cameraRef.current.position.z * 0.5, 0.4);
    if (newZ < minZ) newZ = minZ;
    if (newZ > maxZ) newZ = maxZ;
    
    cameraRef.current.position.z = newZ;
  };

  // Drag and Drop GLB/GLTF model parser
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      load3DModel(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      load3DModel(files[0]);
    }
  };

  const load3DModel = (file: File) => {
    setIsLoading(true);
    setLoadError(null);

    // Register fflate globally to make sure FBXLoader can resolve zip compression seamlessly
    if (typeof window !== 'undefined') {
      (window as any).fflate = fflate;
      (THREE as any).fflate = fflate;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    // Explicit Maya proprietary formats check with clean tutorial guidance:
    if (fileExtension === 'mb' || fileExtension === 'ma') {
      setLoadError("Arquivos nativos (.mb / .ma) do Autodesk Maya são formatos proprietários fechados e não rodam no navegador diretamente. Para visualizar, acesse 'File > Export All' no Maya e salve como FBX (.fbx), OBJ (.obj) ou GLB (.glb) e faça o upload desse novo arquivo exportado!");
      setIsLoading(false);
      return;
    }

    if (fileExtension !== 'glb' && fileExtension !== 'gltf' && fileExtension !== 'fbx' && fileExtension !== 'obj') {
      setLoadError("Selecione um arquivo .glb, .gltf, .fbx ou .obj válido.");
      setIsLoading(false);
      return;
    }

    const fileURL = URL.createObjectURL(file);
    let resolved = false;

    // Safety timeout after 15 seconds to prevent infinite "PROCESSANDO ARQUIVO 3D..." spinning
    const timeoutId = setTimeout(() => {
      if (!resolved && isLoading) {
        setIsLoading(false);
        setLoadError("O processamento do modelo 3D do Maya expirou (limite de 15 segundos). Isso geralmente acontece se o FBX tentar carregar caminhos de textura absolutos do seu computador. Tente exportar com 'Embed Media' ativado no Maya ou prefira o formato .glb.");
        URL.revokeObjectURL(fileURL);
      }
    }, 15000);

    const handleLoadedModel = (model: THREE.Object3D) => {
      resolved = true;
      clearTimeout(timeoutId);

      if (!modelGroupRef.current) return;

      // Clear previous geometries
      while (modelGroupRef.current.children.length > 0) {
        modelGroupRef.current.remove(modelGroupRef.current.children[0]);
      }

      // Reset parent group rotation, position and scale
      modelGroupRef.current.rotation.set(0, 0, 0);
      modelGroupRef.current.position.set(0, 0, 0);
      modelGroupRef.current.quaternion.set(0, 0, 0, 1);

      // Save original materials & setup shadows securely
      originalMaterialsRef.current.clear();
      model.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          originalMaterialsRef.current.set(node, node.material);
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      // Compute precise bounding box focusing strictly on geometry meshes (ignoring remote light helpers/cameras)
      const box = new THREE.Box3();
      let hasMesh = false;

      model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          child.geometry.computeBoundingBox();
          if (child.geometry.boundingBox) {
            const localBox = child.geometry.boundingBox.clone();
            child.updateWorldMatrix(true, true);
            localBox.applyMatrix4(child.matrixWorld);
            if (!hasMesh) {
              box.copy(localBox);
              hasMesh = true;
            } else {
              box.union(localBox);
            }
          }
        }
      });

      // Fallback if no meshes found
      if (!hasMesh) {
        box.setFromObject(model);
      }

      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // Scale beautifully to fit the view viewport without clipping
      const scale = 1.6 / (maxDim || 1);
      model.scale.set(scale, scale, scale);

      // Re-center model relative to its visual geometry center
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

      modelGroupRef.current.add(model);

      // Instantly apply active visual finishes/styles/lighting
      updateStyleAndLighting(visualStyle, lightingMode);
      setHasLoadedCustom(true);
      setIsLoading(false);
    };

    // Prepare robust loading manager to prevent loading errors from absolute path link problems
    const manager = new THREE.LoadingManager();
    
    manager.setURLModifier((url) => {
      const lower = url.toLowerCase();
      // If the URL looks like an absolute local disk path from Maya or references Windows/Mac files system
      if (
        url.includes(':\\') || 
        url.includes(':/') || 
        lower.startsWith('c:') || 
        lower.startsWith('d:') || 
        lower.includes('/users/') || 
        lower.includes('\\') || 
        lower.includes('sourceimages/')
      ) {
        console.warn("Previnido carregamento externo quebrado. Redirecionando imagem local absoluta do Maya para textura neutra:", url);
        // Returns a tiny transparent 1x1 pixel image to resolve instantly without triggering 404 blockages
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      }
      return url;
    });

    manager.onError = (itemUrl) => {
      console.warn("Item de textura/binário com erro, ignorando para prosseguir com a malha:", itemUrl);
    };

    try {
      if (fileExtension === 'fbx') {
        const loader = new FBXLoader(manager);
        loader.load(
          fileURL,
          (fbx) => {
            try {
              handleLoadedModel(fbx);
            } catch (err: any) {
              console.error("Error processing FBX model child components:", err);
              setLoadError("O modelo FBX foi baixado mas falhou no processamento interno da malha: " + (err.message || err));
              setIsLoading(false);
              resolved = true;
              clearTimeout(timeoutId);
            }
            setTimeout(() => URL.revokeObjectURL(fileURL), 2000);
          },
          undefined,
          (error) => {
            console.error("FBX Loader load error:", error);
            setLoadError("Erro ao carregar o arquivo FBX. Verifique se o formato não está compactado de forma incompatível. Dica: prefira exportar em .glb do Maya.");
            setIsLoading(false);
            resolved = true;
            clearTimeout(timeoutId);
            URL.revokeObjectURL(fileURL);
          }
        );
      } else if (fileExtension === 'obj') {
        const loader = new OBJLoader(manager);
        loader.load(
          fileURL,
          (obj) => {
            try {
              handleLoadedModel(obj);
            } catch (err: any) {
              console.error("Error processing OBJ model child components:", err);
              setLoadError("O modelo OBJ foi baixado mas falhou no processamento interno: " + (err.message || err));
              setIsLoading(false);
              resolved = true;
              clearTimeout(timeoutId);
            }
            setTimeout(() => URL.revokeObjectURL(fileURL), 2000);
          },
          undefined,
          (error) => {
            console.error("OBJ Loader load error:", error);
            setLoadError("Erro ao carregar arquivo OBJ do Maya. Verifique se o arquivo não está corrompido.");
            setIsLoading(false);
            resolved = true;
            clearTimeout(timeoutId);
            URL.revokeObjectURL(fileURL);
          }
        );
      } else {
        const loader = new GLTFLoader(manager);
        loader.load(
          fileURL,
          (gltf) => {
            try {
              handleLoadedModel(gltf.scene);
            } catch (err: any) {
              console.error("Error processing GLTF model child components:", err);
              setLoadError("Erro ao processar as malhas do modelo GLTF/GLB: " + (err.message || err));
              setIsLoading(false);
              resolved = true;
              clearTimeout(timeoutId);
            }
            setTimeout(() => URL.revokeObjectURL(fileURL), 2000);
          },
          undefined,
          (error) => {
            console.error("GLTF Loader load error:", error);
            setLoadError("Erro de leitura do arquivo glTF. Dica: Certifique-se de que exportou no formato autônomo .glb.");
            setIsLoading(false);
            resolved = true;
            clearTimeout(timeoutId);
            URL.revokeObjectURL(fileURL);
          }
        );
      }
    } catch (err: any) {
      console.error("Incidente síncrono disparado no loader:", err);
      setLoadError("Exceção repentina ao abrir o arquivo: " + (err.message || err));
      setIsLoading(false);
      resolved = true;
      clearTimeout(timeoutId);
      URL.revokeObjectURL(fileURL);
    }
  };

  const resetToProcedural = () => {
    setHasLoadedCustom(false);
    setLoadError(null);
    if (sceneRef.current && modelGroupRef.current) {
      // Re-trigger procedural build
      while(modelGroupRef.current.children.length > 0){
        modelGroupRef.current.remove(modelGroupRef.current.children[0]);
      }
      
      const buildProceduralJet = () => {
        const planeGroup = new THREE.Group();
        const metalMaterial = new THREE.MeshStandardMaterial({
          color: 0x2e1065,
          metalness: 0.95,
          roughness: 0.08,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        });
        const detailMaterial = new THREE.MeshStandardMaterial({
          color: 0x9333ea,
          emissive: 0xa855f7,
          emissiveIntensity: 0.4,
          metalness: 0.9,
          roughness: 0.1
        });
        const goldMaterial = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          metalness: 0.95,
          roughness: 0.1
        });

        // Fuselage
        const fuselageGeom = new THREE.CylinderGeometry(0.32, 0.28, 4.8, 16);
        fuselageGeom.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(fuselageGeom, metalMaterial);
        planeGroup.add(fuselage);

        const noseGeom = new THREE.ConeGeometry(0.32, 0.9, 16);
        noseGeom.rotateX(-Math.PI / 2);
        noseGeom.translate(0, 0, 2.85);
        const nose = new THREE.Mesh(noseGeom, detailMaterial);
        planeGroup.add(nose);

        const tailGeom = new THREE.ConeGeometry(0.28, 1.2, 16);
        tailGeom.rotateX(Math.PI / 2);
        tailGeom.translate(0, 0, -3.0);
        const tail = new THREE.Mesh(tailGeom, metalMaterial);
        planeGroup.add(tail);

        // Delta Wings left & right
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(-3.8, -1.8);
        wingShape.lineTo(-3.7, -2.1);
        wingShape.lineTo(0, -0.8);
        const wingExtrude = { depth: 0.03, bevelEnabled: true, bevelSegments: 2 };
        const leftWingGeom = new THREE.ExtrudeGeometry(wingShape, wingExtrude);
        leftWingGeom.rotateX(Math.PI / 2);
        leftWingGeom.translate(0, 0, 0.4);
        const leftWing = new THREE.Mesh(leftWingGeom, metalMaterial);
        planeGroup.add(leftWing);

        const rightWingShape = new THREE.Shape();
        rightWingShape.moveTo(0, 0);
        rightWingShape.lineTo(3.8, -1.8);
        rightWingShape.lineTo(3.7, -2.1);
        rightWingShape.lineTo(0, -0.8);
        const rightWingGeom = new THREE.ExtrudeGeometry(rightWingShape, wingExtrude);
        rightWingGeom.rotateX(Math.PI / 2);
        rightWingGeom.translate(0, 0, 0.4);
        const rightWing = new THREE.Mesh(rightWingGeom, metalMaterial);
        planeGroup.add(rightWing);

        planeGroup.scale.set(0.85, 0.85, 0.85);
        planeGroup.position.set(0, -0.2, 0);
        modelGroupRef.current?.add(planeGroup);

        // Record original materials
        originalMaterialsRef.current.clear();
        planeGroup.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            originalMaterialsRef.current.set(node, node.material);
          }
        });

        // Instantly apply active visual finish
        updateStyleAndLighting(visualStyle, lightingMode);
      };
      
      buildProceduralJet();
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      <input 
        type="file" 
        accept=".glb,.gltf,.fbx,.obj,.mb,.ma" 
        onChange={handleFileSelect} 
        className="hidden" 
        id="three-d-file-input"
      />
      {/* 3D Canvas Container */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden flex items-center justify-center touch-none"
      >
        {/* Dynamic scanning laser glow lines overlay mirroring tunnel */}
        <div className="absolute inset-0 xray-mesh opacity-10 pointer-events-none" />
        <div className="absolute top-4 left-4 flex gap-2 z-10 pointer-events-none">
          {hasLoadedCustom && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 rounded-md text-[8px] uppercase font-bold tracking-wider border-purple-500/40">
              Personalizado
            </div>
          )}
        </div>

        {/* Dynamic Studio Customization Controller Panel */}
        {!hideControls && (
          <div className="absolute bottom-4 left-4 flex flex-col gap-3.5 pointer-events-auto bg-black/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 w-[250px] z-10 select-none">
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

        {/* Floating Action Elements */}
        {!hideControls && (
          <div className="absolute bottom-4 right-4 flex gap-2 z-10">
            <button 
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="p-1.5 rounded-lg liquid-glass border-white/10 hover:border-white/30 text-white/60 hover:text-white transition-all flex items-center justify-center font-bold"
              title="Instruções de Conversão Maya (.mb)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            
            {hasLoadedCustom && (
              <button 
                type="button"
                onClick={resetToProcedural}
                className="p-1.5 rounded-lg liquid-glass border-white/10 hover:border-white/30 text-emerald-400 hover:text-emerald-300 transition-all flex items-center justify-center"
                title="Restaurar Procedural Bombardier"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <label 
              htmlFor="three-d-file-input"
              className="p-1.5 rounded-lg bg-purple-600 border border-purple-500 hover:bg-purple-500 text-white cursor-pointer transition-all flex items-center justify-center"
              title="Upload do Modelo 3D"
            >
              <Upload className="w-4 h-4" />
            </label>
          </div>
        )}

        {/* Loading & Help Info Layers */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin mb-3" />
            <p className="text-[10px] text-purple-200 uppercase tracking-widest font-mono">Processando Arquivo 3D...</p>
          </div>
        )}

        {loadError && (
          <div className="absolute top-12 inset-x-4 p-3 bg-red-950/80 border border-red-500/30 rounded-xl text-center z-20">
            <p className="text-[9px] text-red-400 leading-normal">{loadError}</p>
          </div>
        )}

        {showHelp && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md p-6 flex flex-col justify-center text-left text-white z-20 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-purple-400">Instruções para seu Arquivo (.mb)</h4>
              <button 
                type="button" 
                onClick={() => setShowHelp(false)}
                className="text-white/40 hover:text-white text-[10px] uppercase font-bold"
              >
                Fechar
              </button>
            </div>
            <p className="text-[10px] text-white/70 leading-relaxed mb-3">
              O arquivo <strong>.mb (Maya Binary)</strong> é um formato nativo fechado do Autodesk Maya. Navegadores web não conseguem renderizá-lo diretamente sem uma conversão prévia.
            </p>
            <p className="text-[10px] text-white/70 leading-relaxed mb-4">
              <strong>Como exportar do Maya para o Floory:</strong>
            </p>
            <ol className="text-[9px] text-white/50 space-y-2 mb-4 list-decimal pl-4">
              <li>No Autodesk Maya, abra seu arquivo <strong>.mb</strong>.</li>
              <li>Acesse <strong>File &gt; Export All...</strong></li>
              <li>Você pode exportar como <strong>FBX (.fbx)</strong>, <strong>OBJ (.obj)</strong> ou como <strong>glTF Export (.gltf / .glb)</strong>.</li>
              <li>Salve o arquivo convertido e simplesmente arraste-o diretamente para esta caixa ou clique no ícone de Upload!</li>
            </ol>
            <div className="text-[9px] italic text-emerald-400 text-center border border-emerald-500/20 bg-emerald-500/5 p-2 rounded-lg">
              Arraste e solte o arquivo convertido (.glb, .gltf, .fbx ou .obj) aqui para visualizar agora!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
