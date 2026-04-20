//latest update: 2024-06-01

import React, { useState, useMemo, useCallback, useRef, memo } from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
  LayoutAnimation, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import {
  Canvas, Path, Skia, Group, useCanvasRef, matchFont,
} from '@shopify/react-native-skia';
import { Undo2, Redo2, RotateCcw, PenTool, X, ChevronUp, GripHorizontal } from 'lucide-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue, runOnJS, useDerivedValue, useAnimatedStyle,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { useStore } from '../store/useStore';
import { solveMath } from '../API/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_START_X = 16;
const CARD_START_Y = 60;
const CARD_PADDING = 16;

const fontStyle      = { fontFamily: 'serif', fontSize: 18, fontStyle: 'normal', fontWeight: 'normal' };
const fontStyleLarge = { fontFamily: 'serif', fontSize: 24, fontStyle: 'normal', fontWeight: 'normal' };

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

// ─────────────────────────────────────────────────────────────────────────────
// DraggableResultCard
// ─────────────────────────────────────────────────────────────────────────────
const DraggableResultCard = memo(function DraggableResultCard({ mathResult, onClose }) {
  const cardSize = useRef({ width: 0, height: 0 });
  const cardX    = useSharedValue(CARD_START_X);
  const cardY    = useSharedValue(CARD_START_Y);
  const savedX   = useSharedValue(CARD_START_X);
  const savedY   = useSharedValue(CARD_START_Y);

  const dragGesture = useMemo(() => Gesture.Pan()
    .onStart(() => {
      'worklet';
      savedX.value = cardX.value;
      savedY.value = cardY.value;
    })
    .onUpdate((e) => {
      'worklet';
      const maxX = SCREEN_W - cardSize.current.width  - CARD_PADDING;
      const maxY = SCREEN_H - cardSize.current.height - CARD_PADDING;
      cardX.value = Math.max(CARD_PADDING, Math.min(savedX.value + e.translationX, maxX));
      cardY.value = Math.max(CARD_PADDING, Math.min(savedY.value + e.translationY, maxY));
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cardX.value }, { translateY: cardY.value }],
  }));

  const handleLayout = useCallback((e) => {
    cardSize.current = {
      width:  e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    };
  }, []);

  if (!mathResult) return null;

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View style={[styles.resultCard, animatedStyle]} onLayout={handleLayout}>
        <View style={styles.cardHeader}>
          <GripHorizontal color="#BBBBBB" size={18} />
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <X color="#999" size={16} />
          </TouchableOpacity>
        </View>
        {mathResult.steps?.map((step, index) => (
          <Text key={index} style={styles.stepText}>{step}</Text>
        ))}
        <View style={styles.ansRow}>
          <Text style={styles.ansText}>{`= ${mathResult.ans}`}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { paths, addPath, undo, redo, reset } = useStore();

  const [showEditMenu, setShowEditMenu] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [mathResult, setMathResult]     = useState(null);
  const handleClose = useCallback(() => setMathResult(null), []);

  const font      = useMemo(() => matchFont(fontStyle), []);
  const fontLarge = useMemo(() => matchFont(fontStyleLarge), []);

  // ── Shared values ─────────────────────────────────────────────────────────
  const scale    = useSharedValue(1);
  const offsetX  = useSharedValue(0);
  const offsetY  = useSharedValue(0);
  const rotation = useSharedValue(0);

  const savedScale    = useSharedValue(1);
  const savedOffsetX  = useSharedValue(0);
  const savedOffsetY  = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  
  const currentPath = useSharedValue(Skia.Path.Make());
  const isDrawing   = useSharedValue(false);

  const canvasRef = useCanvasRef();

  const canvasMatrix = useDerivedValue(() => {
    const m = Skia.Matrix();
    m.translate(offsetX.value, offsetY.value);
    m.rotate(rotation.value);
    m.scale(scale.value, scale.value);
    return m;
  });

  const strokeWidth = useDerivedValue(() => 2 / scale.value);

  // commitPath only adds to store — does NOT touch currentPath
  const commitPath = useCallback((svgString) => {
    if (svgString && svgString.length > 5) addPath(svgString);
  }, [addPath]);

  // ── Gestures ──────────────────────────────────────────────────────────────
  const pinchGesture = useMemo(() => Gesture.Pinch()
    .onStart(() => { 'worklet'; savedScale.value = scale.value; })
    .onUpdate((e) => {
      'worklet';
      scale.value = Math.max(0.1, Math.min(savedScale.value * e.scale, 10));
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  const rotationGesture = useMemo(() => Gesture.Rotation()
    .onStart(() => { 'worklet'; savedRotation.value = rotation.value; })
    .onUpdate((e) => {
      'worklet';
      rotation.value = savedRotation.value + e.rotation;
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  const panGesture = useMemo(() => Gesture.Pan()
    .minPointers(2)
    .maxPointers(5)
    .onStart(() => {
      'worklet';
      savedOffsetX.value = offsetX.value;
      savedOffsetY.value = offsetY.value;
    })
    .onUpdate((e) => {
      'worklet';
      offsetX.value = savedOffsetX.value + e.translationX;
      offsetY.value = savedOffsetY.value + e.translationY;
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  const transformGesture = useMemo(
    () => Gesture.Simultaneous(pinchGesture, rotationGesture, panGesture),
    [pinchGesture, rotationGesture, panGesture],
  );

  const drawGesture = useMemo(() => Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .averageTouches(false)
    .onStart((e) => {
      'worklet';
      const s   = scale.value;
      const ox  = offsetX.value;
      const oy  = offsetY.value;
      const r   = rotation.value;
      const dx  = e.x - ox;
      const dy  = e.y - oy;
      const cos = Math.cos(-r);
      const sin = Math.sin(-r);
      const wx  = (dx * cos - dy * sin) / s;
      const wy  = (dx * sin + dy * cos) / s;

      // Start fresh path for new stroke — this is the ONLY place we reset.
      // By the time the user starts a new stroke, the previous commitPath()
      // has long since run and the old stroke is safely in `paths`.
      const p = Skia.Path.Make();
      p.moveTo(wx, wy);
      currentPath.value = p;
      isDrawing.value   = true;
    })
    .onUpdate((e) => {
      'worklet';
      if (!isDrawing.value) return;
      const s   = scale.value;
      const ox  = offsetX.value;
      const oy  = offsetY.value;
      const r   = rotation.value;
      const dx  = e.x - ox;
      const dy  = e.y - oy;
      const cos = Math.cos(-r);
      const sin = Math.sin(-r);
      const wx  = (dx * cos - dy * sin) / s;
      const wy  = (dx * sin + dy * cos) / s;

      const p = currentPath.value.copy();
      p.lineTo(wx, wy);
      currentPath.value = p;
    })
    .onEnd(() => {
      'worklet';
      isDrawing.value = false;
      const svgString = currentPath.value.toSVGString();
      // ── Do NOT clear currentPath here ──
      // It stays visible until the next onStart replaces it.
      // commitPath just saves to store; currentPath keeps showing the stroke.
      runOnJS(commitPath)(svgString);
    })
    .onFinalize(() => {
      'worklet';
      // Only clear on an interrupted/cancelled gesture where nothing was committed
      if (isDrawing.value) {
        isDrawing.value   = false;
        currentPath.value = Skia.Path.Make();
      }
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [commitPath]);

  const composed = useMemo(
    () => Gesture.Race(transformGesture, drawGesture),
    [transformGesture, drawGesture],
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSolve = async () => {
    if (!canvasRef.current) return;
    setLoading(true);
    try {
      const image    = canvasRef.current.makeImageSnapshot();
      const bytes    = image.encodeToBytes();
      const base64   = toBase64(bytes);
      const uri      = `data:image/png;base64,${base64}`;
      const formData = new FormData();
      formData.append('file', { uri, name: 'math.png', type: 'image/png' });
      const result = await solveMath(formData);
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
    scale.value       = 1;
    offsetX.value     = 0;
    offsetY.value     = 0;
    rotation.value    = 0;
    currentPath.value = Skia.Path.Make();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <GestureDetector gesture={composed}>
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
              {/*
                currentPath renders the stroke-in-progress AND the last
                completed stroke (until next stroke starts). This covers
                the async gap between onEnd and addPath running on JS thread.
              */}
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
          {loading
            ? <ActivityIndicator color="#000" />
            : <PenTool color="#000" size={28} />}
        </TouchableOpacity>

        <View style={styles.editWrapper} pointerEvents="box-none">
          {showEditMenu && (
            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.iconBtn} onPress={undo}>
                <Undo2 color="#FFD700" size={24} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={redo}>
                <Redo2 color="#FFD700" size={24} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => { handleReset(); setShowEditMenu(false); }}
              >
                <RotateCcw color="#FF4444" size={24} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={() => {
              LayoutAnimation.easeInEaseOut();
              setShowEditMenu(!showEditMenu);
            }}
          >
            {showEditMenu
              ? <X color="#000" size={28} />
              : <ChevronUp color="#000" size={28} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  resultCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    minWidth: 180,
    maxWidth: SCREEN_W - CARD_PADDING * 2,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 6,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 200,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  stepText: {
    fontFamily: 'serif',
    fontSize: 15,
    color: '#444444',
    marginBottom: 2,
    lineHeight: 22,
  },
  ansRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  ansText: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '700',
    color: '#27AE60',
  },
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
