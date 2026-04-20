import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';

export default function SplashScreen({ navigation }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            })
        ]).start();

        const timer = setTimeout(() => {
            navigation.replace('Home');
        }, 1500);

        return () => clearTimeout(timer);
        
        // This line below specifically kills the "missing dependency" error:
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            
            <Animated.View style={[styles.content, { 
                opacity: fadeAnim, 
                transform: [{ scale: scaleAnim }] 
            }]}>
                <Text style={styles.logo}>SOLVE IT</Text>
                <View style={styles.glowLine} />
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>INTELLIGENT CANVAS</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#050505', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    content: {
        alignItems: 'center',
    },
    logo: { 
        color: '#FFD700', 
        fontSize: 48, 
        fontWeight: '900', 
        letterSpacing: 10,
        textShadowColor: 'rgba(255, 215, 0, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    glowLine: {
        height: 1,
        backgroundColor: '#FFD700',
        width: 100,
        marginTop: 5,
        opacity: 0.5,
        shadowColor: '#FFD700',
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 5
    },
    footer: {
        position: 'absolute',
        bottom: 60,
    },
    footerText: {
        color: '#333',
        fontSize: 10,
        letterSpacing: 5,
        fontWeight: 'bold'
    }
});