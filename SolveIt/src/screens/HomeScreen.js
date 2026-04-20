import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, StyleSheet, StatusBar, TouchableOpacity,
  LayoutAnimation, Alert, ActivityIndicator,
} from 'react-native';
import { Canvas, Path, Skia, Group, useCanvasRef } from '@shopify/react-native-skia';
import { Undo2, Redo2, RotateCcw, PenTool, X, ChevronUp } from 'lucide-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSharedValue, runOnJS, useDerivedValue } from 'react-native-reanimated';
import { useStore } from '../store/useStore';
import { solveMath } from '../API/api';

// Import the new component
import DraggableResultCard from '../components/DraggableResultCard';

function toBase64(bytes) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++];
    const b1 = i < bytes.length ? bytes[i++] : 0;
    const b2 = i < bytes.length ? bytes[i++] : 0;
    result += chars[b0 >> 2];
    result += chars[((b0 & 3) << 4) | (b1 >> 4)];
    result += chars[((b1 & 15) << 2) | (b2 >> 6)];
    result += chars[b2 & 63];
  }
  const pad = bytes.length % 3;
  if (pad === 1) result = result.slice(0, -2) + '==';
  else if (pad === 2) result = result.slice(0, -1) + '=';
  return result;
}

export default function HomeScreen() {
  const { paths, addPath, undo, redo, reset } = useStore();
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mathResult, setMathResult] = useState(null);
  const handleClose = useCallback(() => setMathResult(null), []);

  const canvasScale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedOffsetX = useSharedValue(0);
  const savedOffsetY = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  const currentPath = useSharedValue(Skia.Path.Make());
  const isDrawing = useSharedValue(false);
  const canvasRef = useCanvasRef();

  // Matrix calculation for Skia
  const canvasMatrix = useDerivedValue(() => {
    const m = Skia.Matrix();
    m.translate(offsetX.value, offsetY.value);
    m.rotate(rotation.value);
    m.scale(canvasScale.value, canvasScale.value);
    return m;
  });
// 1. Add all dependencies the linter might be asking for
  const commitPath = useCallback((svgString) => {
    if (svgString && svgString.length > 5) addPath(svgString);
  }, [addPath]); // addPath comes from useStore, so it must be here.

  // 2. For the empty arrays, add the SharedValues if your linter is complaining.
  // Note: Usually Reanimated values don't need to be here, but some strict linters require it.
  const canvasPinch = useMemo(() => {
    return Gesture.Pinch()
      .onStart(() => {
        'worklet';
        savedScale.value = canvasScale.value;
      })
      .onUpdate((e) => {
        'worklet';
        canvasScale.value = Math.max(0.1, Math.min(savedScale.value * e.scale, 10));
      });
  }, [canvasScale, savedScale]); // Added shared values to the array

  const canvasRotate = useMemo(() => {
    return Gesture.Rotation()
      .onStart(() => {
        'worklet';
        savedRotation.value = rotation.value;
      })
      .onUpdate((e) => {
        'worklet';
        rotation.value = savedRotation.value + e.rotation;
      });
  }, [rotation, savedRotation]); // Added shared values to the array

  const canvasPan = useMemo(() => {
    return Gesture.Pan()
      .minPointers(2)
      .onStart(() => {
        'worklet';
        savedOffsetX.value = offsetX.value;
        savedOffsetY.value = offsetY.value;
      })
      .onUpdate((e) => {
        'worklet';
        offsetX.value = savedOffsetX.value + e.translationX;
        offsetY.value = savedOffsetY.value + e.translationY;
      });
  }, [offsetX, offsetY, savedOffsetX, savedOffsetY]); // Added shared values to the array

  const drawGesture = useMemo(() => {
    return Gesture.Pan()
      .minPointers(1)
      .maxPointers(1)
      .onStart((e) => {
        'worklet';
        const s = canvasScale.value;
        const r = rotation.value;
        const dx = e.x - offsetX.value;
        const dy = e.y - offsetY.value;
        const cos = Math.cos(-r);
        const sin = Math.sin(-r);
        const wx = (dx * cos - dy * sin) / s;
        const wy = (dx * sin + dy * cos) / s;
        const p = Skia.Path.Make();
        p.moveTo(wx, wy);
        currentPath.value = p;
        isDrawing.value = true;
      })
      .onUpdate((e) => {
        'worklet';
        if (!isDrawing.value) return;
        const s = canvasScale.value;
        const r = rotation.value;
        const dx = e.x - offsetX.value;
        const dy = e.y - offsetY.value;
        const cos = Math.cos(-r);
        const sin = Math.sin(-r);
        const wx = (dx * cos - dy * sin) / s;
        const wy = (dx * sin + dy * cos) / s;
        const p = currentPath.value.copy();
        p.lineTo(wx, wy);
        currentPath.value = p;
      })
      .onEnd(() => {
        'worklet';
        isDrawing.value = false;
        const svgString = currentPath.value.toSVGString();
        runOnJS(commitPath)(svgString);
      });
  }, [commitPath, canvasScale, rotation, offsetX, offsetY, currentPath, isDrawing]); 
  // Added EVERY shared value used inside the gesture to the dependency array

  const transformGesture = useMemo(
    () => Gesture.Simultaneous(canvasPinch, canvasRotate, canvasPan),
    [canvasPinch, canvasRotate, canvasPan]
  );

  const composedCanvasGesture = useMemo(
    () => Gesture.Race(transformGesture, drawGesture),
    [transformGesture, drawGesture]
  );

const handleSolve = async () => {
  if (!canvasRef.current) return;
  setLoading(true);
  try {
    const image = canvasRef.current.makeImageSnapshot();
    const bytes = image.encodeToBytes();
    const base64 = toBase64(bytes);
    const uri = `data:image/png;base64,${base64}`;
    
    const formData = new FormData();
    formData.append('file', { uri, name: 'math.png', type: 'image/png' });
    
    const result = await solveMath(formData);
    console.log("API Result:", result); // <--- ADD THIS TO DEBUG
    
    setMathResult(result); 
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};

  const handleReset = () => {
    reset();
    setMathResult(null);
    canvasScale.value = 1;
    offsetX.value = 0;
    offsetY.value = 0;
    rotation.value = 0;
    currentPath.value = Skia.Path.Make();
  };
  const strokeWidth = useDerivedValue(() => 2 / canvasScale.value);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <GestureDetector gesture={composedCanvasGesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <Canvas ref={canvasRef} style={StyleSheet.absoluteFill}>
            <Group matrix={canvasMatrix}>
              {paths.map((d, i) => (
                <Path
                  key={`p-${i}`}
                  path={d}
                  strokeWidth={strokeWidth}
                  style="stroke"
                  strokeCap="round"
                  strokeJoin="round"
                  color="#000000"
                />
              ))}
              <Path
                path={currentPath}
                strokeWidth={strokeWidth}
                style="stroke"
                strokeCap="round"
                strokeJoin="round"
                color="#000000"
              />
            </Group>
          </Canvas>
        </View>
      </GestureDetector>

      <DraggableResultCard mathResult={mathResult} onClose={handleClose} />

      <View style={styles.uiOverlay} pointerEvents="box-none">
        <TouchableOpacity style={styles.solveBtn} onPress={handleSolve} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <PenTool color="#000" size={28} />}
        </TouchableOpacity>

        <View style={styles.editWrapper} pointerEvents="box-none">
          {showEditMenu && (
            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.iconBtn} onPress={undo}><Undo2 color="#FFD700" size={24} /></TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={redo}><Redo2 color="#FFD700" size={24} /></TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => { handleReset(); setShowEditMenu(false); }}><RotateCcw color="#FF4444" size={24} /></TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={() => {
              LayoutAnimation.easeInEaseOut();
              setShowEditMenu(!showEditMenu);
            }}
          >
            {showEditMenu ? <X color="#000" size={28} /> : <ChevronUp color="#000" size={28} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  uiOverlay: {
    position: 'absolute', bottom: 40, left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', zIndex: 99,
  },
  solveBtn: {
    backgroundColor: '#FFD700', width: 70, height: 70,
    borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 8,
  },
  editWrapper: { alignItems: 'center' },
  mainBtn: {
    backgroundColor: '#FFD700', width: 60, height: 60,
    borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8,
  },
  menuItems: {
    backgroundColor: '#1A1A1A', borderRadius: 30,
    paddingVertical: 15, paddingHorizontal: 10, marginBottom: 10, gap: 15,
  },
  iconBtn: { padding: 8, alignItems: 'center' },
});