import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

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

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
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
        className="w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden flex items-center justify-center touch-none"
      >
        {/* Dynamic scanning laser glow lines overlay mirroring tunnel */}
        <div className="absolute inset-0 xray-mesh opacity-10 pointer-events-none" />

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
      </div>
    </div>
  );
};
