import React, { memo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { X, GripHorizontal } from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_START_X = 16;
const CARD_START_Y = 60;
const CARD_PADDING = 16;

const DraggableResultCard = memo(function DraggableResultCard({ mathResult, onClose }) {
    const cardSize = useRef({ width: 0, height: 0 });

    const cardX = useSharedValue(CARD_START_X);
    const cardY = useSharedValue(CARD_START_Y);
    const savedX = useSharedValue(CARD_START_X);
    const savedY = useSharedValue(CARD_START_Y);

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);

    const dragGesture = Gesture.Pan()
        .onStart(() => {
            'worklet';
            savedX.value = cardX.value;
            savedY.value = cardY.value;
        })
        .onUpdate((e) => {
            'worklet';
            cardX.value = savedX.value + e.translationX;
            cardY.value = savedY.value + e.translationY;
        });

    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            'worklet';
            savedScale.value = scale.value;
        })
        .onUpdate((e) => {
            'worklet';
            const nextScale = savedScale.value * e.scale;
            scale.value = Math.max(0.5, Math.min(nextScale, 3));
        });

    const composedCardGesture = Gesture.Simultaneous(dragGesture, pinchGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: cardX.value },
            { translateY: cardY.value },
            { scale: scale.value },
        ],
    }));

    const handleLayout = useCallback((e) => {
        cardSize.current = {
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
        };
    }, []);

    if (!mathResult) return null;
    const steps = mathResult.steps || mathResult.result?.steps || [];
    const answer = mathResult.ans || mathResult.result?.ans || "No answer found";

    return (
        <GestureDetector gesture={composedCardGesture}>
            <Animated.View style={[styles.resultCard, animatedStyle]} onLayout={handleLayout}>
                <View style={styles.cardHeader}>
                    <GripHorizontal color="#BBBBBB" size={18} />
                    <TouchableOpacity onPress={onClose} hitSlop={12}>
                        <X color="#999" size={16} />
                    </TouchableOpacity>
                </View>
                <View style={styles.cardBody}>
                    {steps.map((step, index) => (
                        <Text key={index} style={styles.stepText}>{step}</Text>
                    ))}
                    <View style={styles.ansRow}>
                        <Text style={styles.ansText}>{`= ${answer}`}</Text>
                    </View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
});

const styles = StyleSheet.create({
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
    cardBody: { overflow: 'hidden' },
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
});

export default DraggableResultCard;